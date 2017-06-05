/**
 * @author John Spackmann @johnspackmann#
 */
const Compile = require("../lib/compile_utils");
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