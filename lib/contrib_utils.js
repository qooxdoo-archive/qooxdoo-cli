const qxcompiler = require("qxcompiler");
require("./qxcli/commands/Compile");
const path = require("path");
const fs = require("fs");

module.exports = {
    
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