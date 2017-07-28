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

/**
 * Command to handle compilation of the current project
 */
require("../lib/qxcli");

module.exports = {
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
    try {
      return new qxcli.commands.Compile(argv).process();
    } catch (e) {
      console.error(e);
    }
  }
};