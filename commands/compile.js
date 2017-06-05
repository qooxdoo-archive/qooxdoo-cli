/**
 * @author John Spackmann @johnspackmann#
 */
const qxcompiler = require('qxcompiler');
const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const async = require('async');

const Compile = {
  /**
   * Parses the command line and produces configuration data
   *
   * @param argv {String[]} arguments
   * @param cb(err, data {Map}) {Function}
   */
  parse: function(argv, cb) {
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
          return cb("Missing --app-class <classname> argument");
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
    }

    var parsedArgs = this.parseImpl(argv);
    var config = {};
    if (parsedArgs.config) {
      Compile.loadConfig(parsedArgs.config, function(err, data) {
        if (err)
          return cb(err);
        config = data;
        mergeArguments();
        cb(null, config);
      });
    } else {
      mergeArguments();
      cb(null, config);
    }
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
   * file ane there is also a .json, then it is loaded and parsed first, and if
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
  loadConfig: function(path, cb) {
    function loadJson(path, cb) {
      fs.readFile(path, { encoding: "utf8" }, function(err, data) {
        if (err)
          return cb(err);
        try {
          data = JSON.parse(data);
        } catch(ex) {
          if (ex)
            return cb("Failed to load " + path + ": " + ex);
        }
        cb(null, data);
      });
    }

    function loadJs(path, inputData, cb) {
      fs.readFile(path, { encoding: "utf8" }, function(err, src) {
        if (err)
          return cb(err);
        var code = eval("(function() { return " + src + " ; })()");

        if (typeof code == "function") {
          code(inputData, function (err, data) {
            if (err)
              return cb(err);
            cb(null, data);
          });
        } else {
          cb(null, code || null);
        }
      });
    }

    // If there is a .json file, load and parse that first so that it can be given to the .js file
    //  as source data (assuming the .js file returns a function)
    if (path.match(/\.js$/)) {
      fs.exists(path + "on", function (exists) {
        if (exists) {
          loadJson(path + "on", function (err, data) {
            if (err)
              return cb(err);
            loadJs(path, data, cb);
          });
        } else {
          loadJs(path, null, cb);
        }
      });
    } else {
      loadJson(path, cb);
    }
  },

  /**
   * Uses loadConfig to load the configuration and produce a Maker
   * @param path {String}
   * @param cb(err, maker {Maker})
   */
  configure: function(path, cb) {
    Compile.loadConfig(path, function(err, data) {
      if (err)
        return cb(err);
      Compile.createMakerFromConfig(data, cb);
    });
  },

  /**
   * Processes the configuration from a JSON data structure and creates a Maker
   *
   * @param data {Map}
   * @param cb(err, maker {Maker})
   */
  createMakerFromConfig: function(data, cb) {
    var maker = new qxcompiler.makers.AppMaker();
    if (!data.target)
      return cb("No target specified");

    var outputPath = data.target.outputPath||".";
    var targetClass = Compile.resolveTargetClass(data.target.type);
    if (!targetClass)
      return cb("Cannot find target class: " + data.target.type);
    maker.setTarget(new targetClass(outputPath));

    maker.setLocales(data.locales||[ "en" ]);
    if (data.writeAllTranslations)
      maker.setWriteAllTranslations(data.writeAllTranslations);

    if (data.environment)
      maker.setEnvironment(data.environment);

    data.applications.forEach(function(appData) {
      var app = new qxcompiler.Application(appData["class"]);
      if (appData.theme)
        app.setTheme(appData.theme);
      if (appData.name)
        app.setName(appData.name);
      if (appData.environment)
        app.setEnvironment(appData.environment);
      maker.addApplication(app);
    });

    async.forEach(data.libraries,
        function(libData, cb) {
          maker.addLibrary(libData.path, cb);
        },
        function(err) {
          return cb(err, err ? null : maker);
        });

    maker.getAnalyser().addListener("classCompiled", function(evt) {
      var data = evt.getData();
      var data = evt.getData();
      var markers = data.dbClassInfo.markers;
      if (markers) {
        markers.forEach(function(marker) {
          var str = qxcompiler.ClassFile.decodeMarker(marker);
          console.log(data.classFile.getClassName() + ": " + str);
        });
      }
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
};

module.exports = {
  command   : "compile [options] [configFile]",
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
    "continuous": {
      describe: "enables continuous compilation",
      type: "boolean"
    },
    "verbose": {
      describe: "enables additional progress output to console",
      type: "boolean"
    }
  },
  handler   : async function(argv){

    // TODO: DRY redundant code
    try {
      Compile.parse(argv, function(err, config) {
        if (err)
          throw new Error("Error: " + err);
        if (!config)
          throw new Error("Error: Cannot find any configuration");
        Compile.createMakerFromConfig(config, function(err, maker) {
          if (err)
            throw new Error("Error: " + err);

          if (!maker)
            throw new Error("Error: Cannot find anything to make");
          maker.make(function() {});
        });
      });
      
    } catch (e) {
      console.error(e);
    }
  }
};