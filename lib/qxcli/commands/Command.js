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

/**
 * Base class for commands
 */
qx.Class.define("qxcli.commands.Command", {
  extend: qx.core.Object,
  
  construct: function(argv) {
    this.base(arguments);
    this.argv = argv;
  },
  
  members: {
    argv: null,
  
    debug: function() {
      var args = qx.lang.Array.fromArguments(arguments);
      if (this.argv.verbose)
        console.log.apply(console, args);
    },
    
    info: function() {
      var args = qx.lang.Array.fromArguments(arguments);
      console.log.apply(console, args);
    },
    
    error: function() {
      var args = qx.lang.Array.fromArguments(arguments);
      console.log.apply(console, args);
    },

    process: function() { 
      throw new Error("No implementation for " + this.classname + ".process"); 
    }
  }
});
