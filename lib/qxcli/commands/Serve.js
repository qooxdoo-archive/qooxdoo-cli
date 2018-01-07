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

const qx = require("qooxdoo");
const qxcompiler = require('qxcompiler');
const fs = qxcompiler.utils.Promisify.fs;
const path = require('upath');
const process = require('process');
const http = require('http');
const express = require('express');

require('app-module-path').addPath(process.cwd() + '/node_modules');

require("./Compile");

/**
 * Handles compilation of the project by qxcompiler
 */
qx.Class.define("qxcli.commands.Serve", {
  extend: qxcli.commands.Compile,

  members: {
    
    __maker: null,
    
    /*
     * @Override
     */
    process: async function() {
      var config = await this.parse(this.argv);
      if (!config)
        throw new qxcli.Utils.UserError("Error: Cannot find any configuration");
      var maker = this.__maker = await this.createMakerFromConfig(config);
      if (!maker)
        throw new qxcli.Utils.UserError("Error: Cannot find anything to make");
      if (this.argv["clean"]) {
        await maker.eraseOutputDir(); 
        await qxcompiler.files.Utils.safeUnlink(maker.getAnalyser().getDbFilename());
        await qxcompiler.files.Utils.safeUnlink(maker.getAnalyser().getResDbFilename());
      }  
      var analyser = maker.getAnalyser();
      var target = maker.getTarget();
      
      maker.addListener("writingApplication", (evt) => qxcompiler.Console.print("qxcli.compile.writingApplication", evt.getData().getName()));
      if (target instanceof qxcompiler.targets.BuildTarget) {
        target.addListener("minifyingApplication", (evt) => qxcompiler.Console.print("qxcli.compile.minifyingApplication", evt.getData().application.getName(), evt.getData().filename));
      }
      
      return qxcompiler.files.Utils.safeStat("source/index.html")
        .then((stat) => stat && qxcompiler.Console.print("qxcli.compile.legacyFiles", "source/index.html"))
        .then(() => this.runWebServer(config))
        .then(() => new qxcli.Watch(maker).start());
    },

    /**
     * 
     * @returns
     */
    runWebServer: function(config) {
      var maker = this.__maker;
      var analyser = maker.getAnalyser();
      var target = maker.getTarget();
      
      const app = express();
      app.use('/', express.static(path.join(__dirname, "../../../serve/_site")))
      app.use('/' + target.getOutputDir(), express.static(target.getOutputDir()));
      
      function getJson(uri, obj) {
        app.get(uri, (req, res) => {
          res.set("Content-Type", "application/json");
          res.send(JSON.stringify(obj, null, 2));
        });
      }
      
      var target = maker.getTarget();
      var obj = {
          target: {
            type: target.getType(),
            outputDir: target.getOutputDir()
          },
          apps: maker.getApplications().map(app => { 
            return { 
              name: app.getName(),
              type: app.getType(),
              title: app.getTitle(),
              outputPath: app.getOutputPath()
            };
          })
      };
      getJson("/serve.api/apps.json", obj);
      
      const webServer = http.createServer(app);
      return new Promise((resolve, reject) => {
        webServer.listen(config.serve.listenPort, function(err) {
          qxcompiler.Console.print("qxcli.serve.webStarted", "http://localhost:" + config.serve.listenPort)
        });
      });
    },
    
    /*
     * @Override
     */
    mergeArguments: function(parsedArgs, config, contribConfig) {
      this.base(arguments, parsedArgs, config, contribConfig);
      if (!config.serve)
        config.serve = {};
      var serve = config.serve;
      serve.listenPort = serve.listenPort||this.argv.listenPort;
      return config;
    }
  },
  
  statics: {
    
    getYargsCommand: function() {
      return {
        command   : "serve [configFile]",
        describe  : "runs a webserver to run the current application with continuous compilation, using compile.json",
        builder   : {
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
          "machine-readable": {
            describe: "output compiler messages in machine-readable format",
            type: "boolean"
          },
          "verbose": {
            alias: "v",
            describe: "enables additional progress output to console",
            type: "boolean"
          },
          "minify": {
            describe: "disables minification (for build targets only)",
            choices: [ "off", "minify", "mangle", "beautify" ],
            default: "mangle"
          },
          "save-unminified": {
            describe: "Saves a copy of the unminified version of output files (build target only)",
            type: "boolean",
            default: false
          },
          "erase": {
            describe: "Enabled automatic deletion of the output directory when compiler version changes",
            type: "boolean",
            default: true
          },
          "typescript": {
            describe: "Outputs typescript definitions in qooxdoo.d.ts",
            type: "boolean"
          },
          "add-created-at": {
            describe: "Adds code to populate object's $$createdAt",
            type: "boolean"
          },
          "clean": {
            describe: "Deletes the target dir before compile",
            type: "boolean"
          },
          "listenPort": {
            describe: "The port for the web browser to listen on",
            type: "number",
            default: 8080
          }
        },
        handler   : function(argv){
          return new qxcli.commands.Serve(argv)
            .process()
            .catch((e) => {
              console.error(e.stack || e.message);
              process.exit(1);
            });
        }
      };
    }
  },
    
  defer: function(statics) {
    qxcompiler.Console.addMessageIds({
      "qxcli.serve.webStarted": "Web server started, please browse to %1"
    });
  }
});

