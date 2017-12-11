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

require("./Command");
require("./MConfig");
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
              console.error(e.stack || e.message);
            });
        }
      };
    }
  },

  members: {

    process: async function() {
      let config = await this.parse(this.argv);
      if (!config) {
        throw new Error("Error: Cannot find any configuration");
      }
      let lintOptions = config.eslintConfig || {
        useEslintrc: false,
        extends: ["qx/browser"]
      };
      if (this.argv.fix) {
        lintOptions.fix = true;
      }
      let linter = new CLIEngine(lintOptions);
      var report = linter.executeOnFiles(["source/class/"]);
      if (report.errorCount > 0) {
        if (this.argv.fix) {
          CLIEngine.outputFixes(report);
        }
        const formatter = linter.getFormatter("codeframe");
        const s = formatter(report.results);
        throw new qxcli.Utils.UserError(s);
      }
    }
  }
});

