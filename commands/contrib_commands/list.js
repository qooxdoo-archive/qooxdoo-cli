'use strict';
const Cache = require('../../lib/cache');
const Conf= require('conf');
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const process = require('process');

module.exports = {
  command   : 'list',
  describe  : 'if no repository name is given, lists all available contribs that are compatible with the project\'s qooxdoo version ("--all" lists incompatible ones as well). Otherwise, list all releases of this contrib library.',
  builder   : {},
  handler   : async function(argv){
    const config         = new Conf();
    const repo_cache     = new Cache('repos');
    const releases_cache = new Cache('releases');
    try {
      if ( ! repo_cache.get("__list__") ){
        console.error("Please run qx-contrib update first.");
        process.exit();
      }
      // get project config.json
      var cfg_path = process.cwd() + path.sep + 'config.json';
      if(argv.verbose) console.log(`>>> config.json path: ${cfg_path}`);
      try {
        var cfg_content = fs.readFileSync(cfg_path,'utf-8');
      } catch (e) {
        console.error(`No config.json in the current working directory.`);
        process.exit(1);
      }
      try {
        var cfg = JSON.parse(cfg_content);
      } catch (e) {
        console.error("The project's config.json cannot be parsed. " +
          "If it contain comments (illegal per JSON specs), please remove them first.");
        if(argv.verbose) console.error(e);
        return;
      }
      // get qooxdoo version
      try {
        var qooxdoo_path = cfg.let.QOOXDOO_PATH;
        if (qooxdoo_path.match(/^[^/]/)){
          qooxdoo_path = process.cwd() + path.sep + qooxdoo_path;
        }
        if(argv.verbose) console.log(`>>> qooxdoo path:     ${qooxdoo_path}`);
        var qooxdoo_version = fs.readFileSync(qooxdoo_path + '/version.txt','utf-8');
      } catch (e) {
        console.error("Cannot read the qooxdoo version used by this project.");
        return;
      }
      // provide backwards-compatibility for non-semver version strings
      if( qooxdoo_version.match(/^[0-9]$/) ) qooxdoo_version += ".0";
      if( qooxdoo_version.match(/^[0-9]+\.[0-9]+$/) ) qooxdoo_version += ".0";
      if( ! qooxdoo_version.match(/^[0-9]+\.[0-9]+.[0-9]+/) ) {
        console.error(`Unsupported version number "${qooxdoo_version}. Please use semver compatible version strings."`);
        process.exit(1);
      }
      if(argv.verbose) console.log(`>>> qooxdoo version:  ${qooxdoo_version}`);

      // has a repository name been given?
      let repo_name = argv._[1];

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
