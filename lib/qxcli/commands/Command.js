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
const qxcompiler = require('qxcompiler');
const process = require('process');
const child_process = require('child_process');
const path = require('upath');

const fs = qxcompiler.utils.Promisify.fs;
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
     * @return {Promise(String)} A promise that resolves with the absolute path to the library
     */ 
    getLibraryPath: async function(){ 
      let libPath = process.cwd(); 
      if ( ! await fs.existsAsync( path.join( libPath, "Manifest.json" ) ) ){
        throw new Error( "Cannot find library path - are you in the right directory?");
      }
      return libPath;
    },

    /**
     * Returns the  path to the current application, depending on the current
     * working directory. An application is assumed if a compile.json file
     * exists. 
     * @throws {Error} Throws an error if no application can be found.
     * @return {Promise(String)} A promise that resolves with the absolute path to the application
     */ 
    getApplicationPath: async function(){ 
      let libPath = process.cwd(); 
      if ( ! await fs.existsAsync( path.join( libPath, "compile.json" ) ) ){
        libPath = path.join( libPath, "demo/default" );
        if ( ! await fs.existsAsync( path.join( libPath, "compile.json" ) ) ){
          throw new Error( "Cannot find application path - are you in the right directory?");  
        }
      }
      return libPath;
    },    

    /**
     * Return the content of a json file in the library as an object. 
     * @param {String} filePath absolute path to the file 
     * @throws {Error} Throws if file cannot be parsed.
     * @return {Promise(Object)} 
     */
    parseJsonFile : async function(filePath){
      try {
        return JSON.parse( await fs.readFileAsync( filePath, "utf-8" ) );
      } catch(e) {
        throw new Error(`Cannot parse ${filePath}:` + e.message );
      }
    },

    /**
     * Returns the content of the Manifest.json file as an object. 
     * @throws {Error} Throws if library cannot be found or file cannot be parsed.
     * @return {Promise(Object)}
     */    
    parseManifest : async function(){
      let manifestPath = path.join( await this.getLibraryPath(), "Manifest.json" );
      return await this.parseJsonFile(manifestPath);
    },

    /**
     * Returns the content of the compile.json file as an object. 
     * @throws {Error} Throws if application cannot be found or file cannot be parsed.
     * @return {Promise(Object)} The compile configuration data
     */    
    parseCompileConfig : async function(){
      let compileJsonPath = path.join( await this.getApplicationPath(), "compile.json" )
      return await this.parseJsonFile(compileJsonPath);
    },

    /**
     * Returns the absolute path to the qooxdoo framework used by the current project
     * @return {Promise(String)|false} Promise that resolves with the path {String} or false 
     * if no path can be determined. 
     */
    getAppQxPath : async function(){
      let compileConfig = await this.parseCompileConfig();
      let qxpath = false;
      let appPath = await this.getApplicationPath();
      for( let somepath of compileConfig.libraries ){
        let manifestPath = path.join( appPath, somepath, "Manifest.json");
        let manifest = await this.parseJsonFile( manifestPath );
        try{
          if( ! qxpath && manifest.provides.namespace === "qx" ) qxpath = somepath;
        } catch(e) {
          throw new Error(`Invalid manifest file ${manifestPath}.`);
        }
      };
      return path.join(appPath,qxpath);
    },


    /**
     * Returns the absolute path to the qooxdoo framework used by the current project, unless
     * the user provided an option "qxpath" in the argv Map, in which case this value is returned.
     * @return {Promise(String)|false} Promise that resolves with the absolute path {String} or false 
     * if no path can be determined. 
     */    
    getUserQxPath : async function(argv={}){
      let qxpath = (argv.qxpath !== undefined) ? argv.qxpath : await this.getAppQxPath();
      return path.isAbsolute(qxpath) ? qxpath : path.resolve( qxpath );
    },

    /**
     * Returns the path to the qooxdoo framework used by the current project. To be replaced by
     * getUserQxPath()
     * @return {Promise} Promise that resolves with the path {String}
     */
    getQooxdooPath : async function(argv)
    {
      return await this.getUserQxPath(argv);
      //const cfg_path = path.join(process.cwd(), 'compile.json');
      //let maker = await new qxcli.commands.Compile(argv).configure(cfg_path);
      //return maker.getAnalyser().getQooxdooPath();
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
     * throwing exceptions when stack trace is redundant. 
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
