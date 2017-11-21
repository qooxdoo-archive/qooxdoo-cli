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
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */

const qx = require("qooxdoo");
const process = require('process');
const child_process = require('child_process');
const path = require('path');

require("../Utils");

/**
 * Base class for commands
 */
qx.Class.define("qxcli.commands.Command", {
  extend: qx.core.Object,
  
  construct: function(argv) {
    this.base(arguments);
    this.argv = argv;
    if (argv.verbose) {
      qxcli.LogAppender.setMinLevel("debug");
    }
  },
  
  members: {
    argv: null,
  
    /**
     * Method that is called to do the actual work of the subclass.
     * Stub to be overridden.
     */
    process: function() { 
      throw new Error("No implementation for " + this.classname + ".process"); 
    },

    /**
     * Force exit a CLI command, displaying an error message. Better than
     * throwing exceptionb when stack trace is redundant. 
     * @param {String} message
     */
    exit : function(message){
      console.error(message);
      process.exit();
    },
    
    /**
     * Awaitable wrapper around child_process.spawn. 
     * Runs a command in a separate process. The output of the command
     * is ignored. Throws when the exit code is not 0.
     * @param  {String} cmd Name of the command
     * @param  {Array} args Array of arguments to the command
     * @return {Promise} A promise that resolves with the exit code
     */
    run : function(cmd, args) {
      let opts = { env: process.env };
      return new Promise((resolve, reject) => {
        let exe = child_process.spawn(cmd, args , opts);
        // suppress all output unless in verbose mode
        exe.stdout.on('data', (data) => {
          if(this.argv.verbose) console.log(data.toString());
        });
        exe.stderr.on('data', (data) => {
          if(this.argv.verbose) console.error(data.toString());
        });
        exe.on('close', (code) => {
          if( code !== 0 ) {
            let message = `Error executing ${cmd.join(" ")}. Use --verbose to see what went wrong.`;
            this.exit(message);
          } else {
            resolve(0);
          }
        });
        exe.on('error', reject);
      });
    },

    /**
     * Awaitable wrapper around child_process.exec
     * Executes a command and return its result wrapped in a Promise.
     * @param {String} Command with all parameters
     * @param {Promise} Promise that resolves with the result
     */
    exec : function(cmd){
      return new Promise((resolve,reject)=>{
        child_process.exec(cmd, (err, stdout, stderr) => {
          if (err) reject(err);
          if (stderr) reject(new Error(stderr));
          resolve(stdout);
        });
      });
    },

    /**
     * Returns the absolute path to the tempate directory
     * @return {String}
     */
    getTemplateDir : function(){
      return  path.join( __dirname, "..", "..", "..", "templates" );
    }
  }
});
