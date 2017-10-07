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

/*global qxcli*/

require("./Command");
require("./Compile");

const qx = require("qooxdoo");
const fs = require('fs');
const path = require('path');
const process = require('process');
const jsonlint = require("jsonlint");

/**
 * Handles contrib libraries
 */
qx.Class.define("qxcli.commands.Contrib", {
  extend: qxcli.commands.Command,
  
  members: {
  
    /**
     * The current cache object
     */
    __cache : null,
    
    /**
     * Returns the absolute path to the file that persists the cache object
     * @return {String}
     */
    getCachePath : function(){
      return path.dirname(__dirname) + "/.contrib-cache.json";
    },

    /**
     * Returns the URL of the cache data in the qx-contrib repository
     * @return {String}
     */
    getRepositoryCacheUrl : function(){
      return "https://raw.githubusercontent.com/qooxdoo/qx-contrib/master/cache.json";
    },
    
    /**
     * Returns the cache object, retrieving it from a local file if necessary
     * @return {Object}
     */
    getCache : function(){
      if ( this.__cache && typeof this.__cache == "object"){
        return this.__cache;
      }
      try {
        this.__cache = jsonlint.parse(fs.readFileSync(this.getCachePath(),"UTF-8"));
      } catch(e) {
        this.__cache = {
          repos : {
            list : [],
            data : {}
          },
          compat : {}
        };
      }
      return this.__cache;
    },

    /**
     * Manually overwrite the cache data
     * @param data {Object}
     * @return {void}
     */
    setCache : function(data){
      this.__cache = data;
    },
    
    /**
     * Saves the cache to a hidden local file
     * @return {void}
     */
    saveCache : function(){
      fs.writeFileSync(this.getCachePath(), JSON.stringify(this.__cache,null,2),"UTF-8");
    },
    
    /**
     * Exports the cache to an external file. Note that the structure of the cache
     * data can change any time. Do not build anything on it. You have been warned.
     * @param path {String}
     * @return {void}
     */
    exportCache : function(path){
      try{
        fs.writeFileSync(path, JSON.stringify(this.__cache,null,2),"UTF-8");  
      } catch (e) {
        console.error( `Error exporting cache to ${path}:` + e.message);
      }
    },
    
    /**
     * Clears the cache
     */
    clearCache : function(){
      this.__cache = null;
      try{
        fs.unlinkSync(this.getCachePath());
      } catch(e){}
    },
    
    /**
     * Returns the path to the qooxdoo framework used by the current project
     * @return {Promise} Promise that resolves with the path {String}
     */
    getQooxdooPath : async function(argv)
    {
      const cfg_path = process.cwd() + path.sep + 'compile.json';
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
    }
  }
});