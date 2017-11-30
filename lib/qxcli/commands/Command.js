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
const fs = require('fs');
const process = require('process');
const child_process = require('child_process');
const path = require('upath');

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
     * Returns the  path to the current library, depending on the current
     * working directory. A library is assumed if a Manifest.json file
     * exists. 
     * @throws {Error} Throws an error if no library can be found.
     * @return {String} The absolute path to the library
     */ 
    getLibraryPath: function(){ 
      let libPath = process.cwd(); 
      if ( ! fs.existsSync( path.join( libPath, "Manifest.json" ) ) ){
        throw new Error( "Cannot find library - are you in the right directory?");
      }
      return libPath;
    },

    /**
     * Returns the content of a json file in the library as an object. 
     * @param {String} Relative path of the file in the library
     * @throws {Error} Throws if library cannot be found or file cannot be parsed.
     * @return {Object}
     */
    parseJsonFile : function(relativePath){
      let filePath = path.join( this.getLibraryPath(), relativePath );
      try {
        return JSON.parse( fs.readFileSync( filePath, "utf-8" ) );
      } catch(e) {
        throw new Error(`Cannot parse ${filePath}:` + e.message );
      }
    },

    /**
     * Returns the content of the Manifest.json file as an object. 
     * @throws {Error} Throws if library cannot be found or file cannot be parsed.
     * @return {Object}
     */    
    parseManifest : function(){
      return this.parseJsonFile("Manifest.json");
    },

    /**
     * Returns the content of the compile.json file as an object. Will look into
     * the demo/default/ directory since contrib libraries often do not have a
     * compile.json file (since they are meant to be included in other applications).
     * @throws {Error} Throws if library cannot be found or file cannot be parsed.
     * @return {Object} The compile configuration data
     */    
    parseCompileConfig : function(){
      try {
        return this.parseJsonFile("compile.json");
      } catch( e ) {
        return this.parseJsonFile("demo/default/compile.json");
      }
    },

    /**
     * Returns the path to the qooxdoo framework used by the current project
     * @return {Promise} Promise that resolves with the path {String}
     */
    getQooxdooPath : async function(argv)
    {
      const cfg_path = path.join(process.cwd(), 'compile.json');
      let maker = await new qxcli.commands.Compile(argv).configure(cfg_path);
      return maker.getAnalyser().getQooxdooPath();
    },
    
    /**
     * Given the path to a qooxdoo framework folder, returns the qooxdoo version 
     * in semver-compatible format.
     * @param {String} qooxdoo_path
     * @return {String} qooxdoo version
     */
    getQooxdooVersion : function(qooxdoo_path)
    {
      var qooxdoo_version = fs.readFileSync( path.dirname(qooxdoo_path) + '/version.txt','utf-8');
      if( qooxdoo_version.match(/^[0-9]$/) ) qooxdoo_version += ".0";
      if( qooxdoo_version.match(/^[0-9]+\.[0-9]+$/) ) qooxdoo_version += ".0";
      if( ! qooxdoo_version.match(/^[0-9]+\.[0-9]+.[0-9]+/) ) {
        throw new Error(`Unsupported version number "${qooxdoo_version}. Please use semver compatible version strings."`);
      }
      return qooxdoo_version;
    },
  
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
