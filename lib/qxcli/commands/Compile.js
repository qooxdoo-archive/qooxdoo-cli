/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Zenesis Ltd

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)

************************************************************************ */

const {promisify} = require('util');

const qx = require("qooxdoo");
const qxcompiler = require('qxcompiler');
const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const async = require('async');
const JsonToAst = require("json-to-ast");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

require("./Command");

/**
 * Handles compilation of the project by qxcompiler
 */
qx.Class.define("qxcli.commands.Compile", {
  extend: qxcli.commands.Command,
  
  members: {
    /*
     * @Override
     */
    process: async function() {
      var config = await this.parse(this.argv);
      if (!config)
        throw new Error("Error: Cannot find any configuration");
      var maker = await this.createMakerFromConfig(config);
      if (!maker)
        throw new Error("Error: Cannot find anything to make");
      
      // Simple one of make
      if (!this.argv.watch) {
        var p = new Promise((resolve, reject) => {
            maker.make(function(err) {
              if (err)
                return reject(err);
              resolve();
            });
          });
        return p;
      }
      
      // Continuous make
      return new qxcli.commands.Watch(maker).start();
    },
    
    /**
     * Parses the command line and produces configuration data
     *
     * @param argv {String[]} arguments
     * @param cb(err, data {Map}) {Function}
     */
    parse: async function(argv) {
      var t = this;
      
      /* Merges the parsed argv into the config data */
      function mergeArguments() {
        if (parsedArgs.config) {
          var defaultTarget = parsedArgs.target||config.defaultTarget;
          if (defaultTarget) {
            for (var i = 0; i < config.targets.length; i++) {
              if (config.targets[i].type == defaultTarget) {
                config.target = config.targets[i];
                break;
              }
            }
          }
          if (!config.target) {
            if (config.targets.length == 1)
              config.target = config.targets[0];
          }

        } else {
          var target = config.target = {};
          if (parsedArgs.target)
            target.type = parsedArgs.target;
          if (parsedArgs.outputPath)
            target.outputPath = parsedArgs.outputPath;
        }

        if (!config.locales)
          config.locales = [];
        if (parsedArgs.locales) {
          parsedArgs.locales.forEach(function (locale) {
            if (config.locales.indexOf(locale) < 0)
              config.locales.push(locale);
          });
        }
        if (typeof parsedArgs.writeAllTranslations == "boolean")
          config.writeAllTranslations = parsedArgs.writeAllTranslations;

        if (parsedArgs.environment) {
          if (!config.environment)
            config.environment = {};
          for (var key in parsedArgs.environment)
            config.environment[key] = parsedArgs.environment[key];
        }

        if (!config.applications)
          config.applications = [];
        var appIndex = 0;
        parsedArgs.applications.forEach(function(app) {
          appIndex++;
          if (!app.appClass)
            throw new Error("Missing --app-class <classname> argument");
          var configApp = {
            "class": app.appClass
          };
          if (app.theme)
            configApp.theme = theme;
          if (app.name)
            configApp.name = name;
          config.applications.push(configApp);
        });

        if (parsedArgs.libraries) {
          if (!config.libraries)
            config.libraries = [];
          parsedArgs.libraries.forEach(function(path) {
            config.libraries.push(path);
          });
        }
        if (contribConfig.libraries) {
          contribConfig.libraries.forEach(function(library) {
            config.libraries.push(library.path);
          });
        }
      }

      var parsedArgs = this.parseImpl(argv);
      var config = {};
      var contribConfig = {};
      if (parsedArgs.config) {
        config = await this.loadConfig(parsedArgs.config);
        try {
          var name = path.join(path.dirname(parsedArgs.config), "contrib.json");
          contribConfig = await this.loadConfig(name);
        } catch(ex) {
          // Nothing
        }
        mergeArguments();
      } else {
        mergeArguments();
      }
      if (config.libraries) {
        config.libraries.forEach(function(path) {
          if (typeof path === "object" && typeof path.path === "string")
            throw new Error("Configuration for libraries has changed - it is now an array of strings, each of which is a path to the directory containing Manifest.json.  Please run 'qx upgrade'");
        });
      }
      return config;
    },

    /**
     * Parses the command line, and produces a normalised configuration; this is intended for use
     * by the parse method and unit tests only; while this method is public, expect the data
     * structure to change without warning.
     *
     * @param argv
     * @return {Obj}
     */
    parseImpl: function(argv) {
      let apps = [];
      let app = null;
      let result = {
        target: argv.target,
        outputPath: argv.outputPath||null,
        locales: null,
        writeAllTranslations: argv.writeAllTranslations,
        environment: {},
        applications: apps,
        libraries: argv.library||[],
        config: argv.configFile||"compile.json",
        continuous: argv.continuous,
        verbose: argv.verbose
      };
      if (argv.set) {
        argv.set.forEach(function(kv) {
          var m = kv.match(/^([a-z0-9_]+)(=(.*))?$/);
          if (m) {
            var key = m[1];
            var value = m[3];
            result.environment[key] = value;
          }
        });
      }

      if (argv.locale && argv.locale.length)
        result.locales = argv.locale;
      return result;
    },
    
    /**
     * Loads a configuration file from a .js or .json file; if you provide a .js
     * file and there is also a .json, then it is loaded and parsed first, and if
     * the .js file returns a Function then the function is called with the parsed
     * data from the .json file as a parameter.
     *
     * The Function returned from a .js file MUST accept two arguments, one for the
     * data (which will be null if there is no .json) and the second is the callback
     * to call when complete; the callback takes an error object and the output
     * configuration data.
     *
     * Configuration files do not support processes, job executions, or even
     * macros - if you want to add basic processing (eg for macros), use a .js file to
     * manipulate the data.  If you want to customise the Maker that is produced, you
     * need to use the API directly.
     *
     * @param path {String}
     * @param cb(err, data {Map})
     */
    loadConfig: async function(path) {

      async function loadJs(path, inputData) {
        var src = await readFile(path, { encoding: "utf8" });
        var code = eval("(function() { return " + src + " ; })()");

        return new Promise((resolve, reject) => {
          code(inputData, function (err, data) {
            if (err)
              return reject(err);
            resolve(data);
          });
        });
      }

      // If there is a .json file, load and parse that first so that it can be given to the .js file
      //  as source data (assuming the .js file returns a function)
      if (path.match(/\.js$/)) {
        var json = null;
        try {
          json = await qxcli.commands.Compile.loadJson(path + "on");
        } catch(err) {
          if (err.code != "ENOENT")
            throw new Error("Cannot load JSON from " + path + "on: " + err);
        }
        return loadJs(path, null);
      } else {
        return qxcli.commands.Compile.loadJson(path);
      }
    },

    /**
     * Uses loadConfig to load the configuration and produce a Maker.
     * Instead of the callback-style, you can also use the returned Promise
     * @param path {String}
     * @param cb(err, maker {Maker}) The callback. Omit when using promises
     * @return {Promise} A promise that resolves with the maker object. 
     */
    configure: async function(path, cb) {
      var t = this;
      return t.loadConfig(path).then((data) => {
        if (data.target === undefined) {
          data.target = data.targets.find((target)=>target.type == data.defaultTarget); 
        }
        var maker = t.createMakerFromConfig(data);
        return maker;
      });
    },

    /**
     * Processes the configuration from a JSON data structure and creates a Maker
     *
     * @param data {Map}
     * @return {Maker}
     */
    createMakerFromConfig: async function(data) {
      var t = this;
      var maker = null;
      
      var outputPath = data.target.outputPath||".";
      
      maker = new qxcompiler.makers.AppMaker();
      
      if (!data.target)
        throw new Error("No target specified");
      var targetClass = this.resolveTargetClass(data.target.type);
      if (!targetClass)
        throw new Error("Cannot find target class: " + data.target.type);
      maker.setTarget(new targetClass(outputPath));

      maker.setLocales(data.locales||[ "en" ]);
      if (data.writeAllTranslations)
        maker.setWriteAllTranslations(data.writeAllTranslations);
      
      var environment = {};
      if (data.environment)
        Object.assign(environment, data.environment);
      if (data.target.environment)
        Object.assign(environment, data.target.environment);
      maker.setEnvironment(environment);
      
      function mergeArray(dest, ...srcs) {
        srcs.forEach(function(src) {
          if (src) {
            src.forEach(function(elem) {
              if (!qx.lang.Array.contains(dest, src))
                dest.push(elem);
            });
          }
        });
        return dest;
      }

      data.applications.forEach(function(appData) {
        var appClass = qxcompiler.app.Application;
        if (appData.compiler) {
          appClass = qx.Class.getByName(appData.compiler);
          if (!appClass)
            throw new Error("Cannot find application compiler class " + appData.compiler);
        }
        var app = new appClass(appData["class"]);
        if (appData.theme)
          app.setTheme(appData.theme);
        if (appData.name)
          app.setName(appData.name);
        if (appData.environment)
          app.setEnvironment(appData.environment);
        app.set({
          exclude: mergeArray([], data.exclude, data.target.exclude, appData.exclude),
          include: mergeArray([], data.include, data.target.include, appData.include)
        });
        maker.addApplication(app);
      });

      maker.getAnalyser().addListener("classCompiled", function(evt) {
        var data = evt.getData();
        var data = evt.getData();
        var markers = data.dbClassInfo.markers;
        if (markers) {
          markers.forEach(function(marker) {
            var str = qxcompiler.ClassFile.decodeMarker(marker);
            t.warn(data.classFile.getClassName() + ": " + str);
          });
        }
      });
      
      return new Promise((resolve, reject) => {
        async.forEach(data.libraries,
            function(path, cb) {
              maker.addLibrary(path, cb);
            },
            function(err) {
              if (err)
                reject(err);
              else
                resolve(maker);
            });
      });
    },

    /**
     * Resolves the target class instance from the type name; accepts "source", "build", "hybrid" or
     * a class name
     * @param type {String}
     * @returns {Maker}
     */
    resolveTargetClass: function(type) {
      if (!type)
        return null;
      if (type.$$type == "Class")
        return type;
      if (type == "build")
        return qxcompiler.targets.BuildTarget;
      if (type == "source")
        return qxcompiler.targets.SourceTarget;
      if (type == "hybrid")
        return qxcompiler.targets.HybridTarget;
      if (type == "typescript")
        return qxcompiler.targets.TypeScriptTarget;
      if (type) {
        var targetClass;
        if (data.target.type.indexOf('.') < 0)
          targetClass = qx.Class.getByName("qxcompiler.targets." + type);
        else
          targetClass = qx.Class.getByName(type);
        return targetClass;
      }
      return null;
    }
  },
  
  statics: {
    
    getYargsCommand: function() {
      return {
        command   : "compile [configFile]",
        describe  : "compiles the current application, using compile.json",
        builder   : {
          "all-targets": {
            describe: "Compile all targets in config file",
            type: "boolean"
          },
          "target": {
            "default": "source",
            describe: "Set the target type: source, build, hybrid or class name",
            requiresArg: true,
            type: "string"
          },
          "output-path": {
            describe: "Base path for output",
            nargs: 1,
            requiresArg: true,
            type: "string"
          },
          "locale": {
            describe: "Compile for a given locale",
            nargs: 1,
            requiresArg: true,
            type: "string",
            array: true
          },
          "write-all-translations": {
            describe: "enables output of all translations, not just those that are explicitly referenced",
            type: "boolean"
          },
          "set": {
            describe: "sets an environment value",
            nargs: 1,
            requiresArg: true,
            type: "string",
            array: true
          },
          "app-class": {
            describe: "sets the application class",
            nargs: 1,
            requiresArg: true,
            type: "string"
          },
          "app-theme": {
            describe: "sets the theme class for the current application",
            nargs: 1,
            requiresArg: true,
            type: "string"
          },
          "app-name": {
            describe: "sets the name of the current application",
            nargs: 1,
            requiresArg: true,
            type: "string"
          },
          "library": {
            describe: "adds a library",
            nargs: 1,
            requiresArg: true,
            type: "string",
            array: true
          },
          "watch": {
            describe: "enables watching for changes and continuous compilation",
            type: "boolean"
          },
          "verbose": {
            describe: "enables additional progress output to console",
            type: "boolean"
          }
        },
        handler   : function(argv){
          return new qxcli.commands.Compile(argv).process()
            .catch((e) => {
              console.error(e.stack||e);
            });
        }
      };
    },
    
    loadJson: async function(path) {
      var data = await readFile(path, { encoding: "utf8" });
      try {
        var ast = JsonToAst.parseToAst(data);
        var json = JsonToAst.astToObject(ast);
        return json;
      } catch(ex) {
        throw new Error("Failed to load " + path + ": " + ex);
      }
    }

  }
});
