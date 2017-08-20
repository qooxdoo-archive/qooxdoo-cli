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

require("../Contrib");

const qx = require("qooxdoo");
const fs = require('fs');
const path_module = require('path');
const process = require('process');
const rimraf = require('rimraf');

/**
 * Installs a contrib libraries
 */
qx.Class.define("qxcli.commands.contrib.Remove", {
  extend: qxcli.commands.Contrib,

  statics: {
    getYargsCommand: function() {
      return {
        command: 'remove [repository]',
        describe: 'removes a contrib library from the configuration.',
        builder: {},
        handler: function(argv) {
          return new qxcli.commands.contrib.Remove(argv)
            .process()
            .catch((e) => {
              console.error(e.stack || e);
            });
        }
      };
    }
  },

  members: {

    /**
     * Lists contrib libraries compatible with the current project
     */
    process: async function() {
  
      let argv = this.argv;
      let repos_cache = this.getCache().repos;

      if ( repos_cache.list.length == 0 ){
        console.error("You need to execute 'qx contrib update' first.");
        process.exit(1);
      }
    
      let qooxdoo_path = await this.getQooxdooPath(argv);
      if(argv.verbose) console.log(`>>> qooxdoo path:     ${qooxdoo_path}`);
      let qooxdoo_version = this.getQooxdooVersion(qooxdoo_path);
      if(argv.verbose) console.log(`>>> qooxdoo version:  ${qooxdoo_version}`);

      if ( this.getCache().compat[qooxdoo_version] === undefined ){
        console.error("You need to execute 'qx contrib list' first.");
        process.exit(1);
      }
     
      // has a repository name been given?
      let repo_name = argv.repository || (console.error("No repo name given") || process.exit(1) );

      // read libraries array from contrib.json or create new 
      let contrib_json_path = process.cwd() + "/contrib.json";
      let data = fs.existsSync(contrib_json_path) ?
         JSON.parse( fs.readFileSync(contrib_json_path,"utf-8") ) :
         { libraries : [ ] };
    
      // does the repository name already exist?
      let found = [];
      for ( let [index, elem] of data.libraries.entries() ){
        if( elem.repo_name == repo_name ){
          data.libraries.splice(index,1);
          found.push(index);
        }
      } 
      if( found.length ){
        rimraf.sync(path_module.dirname(data.libraries[found[0]].path));
        if (! argv.quiet) console.warn(`Deleted ${found.length} entries for ${repo_name}`);
      } else if( argv.verbose) {
        console.warn(`No entry for ${repo_name}`);
      }
      fs.writeFileSync( contrib_json_path, JSON.stringify(data, null, 2), "utf-8");
    }
  }
});
