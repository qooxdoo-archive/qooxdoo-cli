'use strict';
const Cache = require('../../lib/cache');
const contrib_utils = require('../../lib/contrib_utils');
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const process = require('process');

module.exports = {
  command   : 'list',
  describe  : 'if no repository name is given, lists all available contribs that are compatible with the project\'s qooxdoo version ("--all" lists incompatible ones as well). Otherwise, list all releases of this contrib library.',
  builder   : {},
  handler   : async function(argv){
    const repo_cache     = new Cache('repos');
    const releases_cache = new Cache('releases');

    try {
      if ( ! repo_cache.get("__list__") ){
        console.error("Please run qx-contrib update first.");
        process.exit();
      }
      let qooxdoo_path = await contrib_utils.getQooxdooPath(argv);
      if(argv.verbose) console.log(`>>> qooxdoo path:     ${qooxdoo_path}`);
      let qooxdoo_version = contrib_utils.getQooxdooVersion(qooxdoo_path);
      if(argv.verbose) console.log(`>>> qooxdoo version:  ${qooxdoo_version}`);
     
      // has a repository name been given?
      let repo_name = argv._[2];

      // list the latest release of each library compatible with the current qooxdoo version
      let list = repo_cache.get("__list__");
      list.forEach((name)=>{
        
        // if a repository name has been passed, list all releases of this repo, otherwise skip
        if ( repo_name && name !== repo_name ) return;
        // get releases version
        let { description, num_releases, tag_names } = repo_cache.get(name);
        
        if (argv.verbose) console.log(`>>> ${name} has ${tag_names.length} releases`);
        if(num_releases == 0 && ! argv.all ) return;
        let compatibleTagName = false;
        let releaseInfo = [];
        tag_names.forEach((tag_name)=>{
          let release_data = releases_cache.get(name+tag_name);
          if( ! release_data ) return;
          let { prerelease, qx_versions} = release_data;
          if (argv.verbose) console.log(`>>> ${tag_name} is compatible with qooxdoo versions ${qx_versions}`);
          let isCompatible = semver.satisfies(qooxdoo_version, qx_versions, true);
          releaseInfo.push(`    ${tag_name} ${prerelease?"(prerelease)":""} ${isCompatible?"":"(incompatible)"}`);
          if ( isCompatible && ! prerelease){
            compatibleTagName = tag_name;
          };
        });
        if( ! compatibleTagName && ! argv.all ) return;
        let title = name + ` (${compatibleTagName||(num_releases?"incompatible":"no releases")})`;
        let padding = " ".repeat(Math.max(50-title.length,1));
        console.info(title +  padding + description);
        if( releaseInfo.length && (argv.verbose || repo_name ) ) console.info(releaseInfo.join("\n"));
        releases_cache.set(name+"_latestCompatible",compatibleTagName);
      });
      releases_cache.set("__initialized__",true);
    } catch (e) {
      console.error(e);
    }
  }
};
