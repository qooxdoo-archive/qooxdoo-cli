/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Christian Boulanger

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */

require("./Command");

const qx = require("qooxdoo");

/**
 * Handles contrib libraries
 */
qx.Class.define("qxcli.commands.Add", {
  extend: qxcli.commands.Command,
  
  statics: {
    
    getYargsCommand: function() {
      return {
        command : "add <command> [options]",
        desc : "adds new elements to an existing qooxdoo application/library",
        builder : function (yargs) { 
          return yargs 
            .commandDir('../../../commands/add_commands') 
            .demandCommand() 
            .showHelpOnFail() 
        }, 
        handler : function(argv){
        }
      }
    }
  }, 
  
  members: {
    // place for common methods.
  }
});