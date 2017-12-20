/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Christian Boulanger and others

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project"s top-level directory for details.

   Authors:
     * Henner Kollmann (hkollmann)

************************************************************************ */

const qx = require("qooxdoo");

const CLIEngine = require("eslint").CLIEngine;
const async = require("async");

require("./Command");
require("./MConfig");

/* global qxcli */

qx.Class.define("qxcli.commands.Lint", {
  extend: qxcli.commands.Command,
  include: [qxcli.commands.MConfig],

  statics: {
    getYargsCommand: function() {
      return {
        command   : "lint [configFile]",
        describe: "runs eslint on the current application.",
        builder: {
          fix: {
            describe: "runs eslint --fix"
          },
          V:{
            alias : "verbose",
            describe: "Verbose logging"
          }
        },
        handler: function(argv) {
          return new qxcli.commands.Lint(argv)
            .process()
            .catch(e => {
              console.log(e.stack || e.message);
            });
        }
      };
    }
  },

  members: {

    process: async function() {
      let config = await this.parse(this.argv);
      if (!config) {
        throw new qxcli.Utils.UserError("Error: Cannot find any configuration");
      }
      let lintOptions = config.eslintConfig || {
        useEslintrc: false,
        extends: ["qx/browser"]
      };
      lintOptions.useEslintrc = false;
      lintOptions.globals = await this.__addGlobals(config);  
      let linter = new CLIEngine({baseConfig: lintOptions});
      linter.options.fix = this.argv.fix;
      var report = linter.executeOnFiles(["source/class/"]);
      if (report.errorCount > 0  || report.warningCount > 0) {
        if (linter.options.fix) {
          CLIEngine.outputFixes(report);
        }
        const formatter = linter.getFormatter("codeframe");
        const s = formatter(report.results);
        throw new qxcli.Utils.UserError(s);
      } else {
        console.info("No errors found!");
      }

    },

    __addGlobals: async function(data) {
      let t = this;
      let result = {};
      return new Promise((resolve, reject) => {
        async.forEach(data.libraries,
          function(path, cb) {
            t.__addLibrary(path, result, cb);
          },
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
      });
      
    },

    __addLibrary: function(rootDir, result, cb) {
      var lib = new qxcompiler.app.Library();
      lib.loadManifest(rootDir, function(err) {
        if (!err)
          result[lib.getNamespace()] = false;       
        return cb && cb(err, lib);
      });
    }  
  
  }
});

