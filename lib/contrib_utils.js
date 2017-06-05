const qxcompiler = require("qxcompiler");
const compile_utils = require('./compile_utils');
const path = require("path");
const fs = require("fs");

module.exports = {
    
  /**
   * Returns the path to the qooxdoo framework used by the current project
   * @return {Promise} Promise that resolves with the path {String}
   */
  getQooxdooPath : async function()
  {
    const cfg_path = process.cwd() + path.sep + 'compile.json';
    let maker = await compile_utils.configure(cfg_path);
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