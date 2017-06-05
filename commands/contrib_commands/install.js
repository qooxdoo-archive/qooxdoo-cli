const Cache = require('../../lib/cache');
const contrib_utils = require('../../lib/contrib_utils');
const Conf= require('conf');
const download = require('download');
const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');

module.exports = {
  command   : 'install',
  describe  : 'installs the latest compatible release of a contrib library (as per Manifest.json). Use "-r <release tag>" to install this particular release.',
  builder   : {},
  handler   : async function(argv){
    const config         = new Conf();
    const repo_cache     = new Cache('repos');
    const releases_cache = new Cache('releases');

    // TODO: DRY redundant code
    try {
      if ( ! releases_cache.get("__initialized__") ){
        console.error("You need to execute the 'list' command first.");
        process.exit(1);
      }
      
      let qooxdoo_path = await contrib_utils.getQooxdooPath();
      if(argv.verbose) console.log(`>>> qooxdoo path:     ${qooxdoo_path}`);
      let qooxdoo_version = contrib_utils.getQooxdooVersion(qooxdoo_path);
      if(argv.verbose) console.log(`>>> qooxdoo version:  ${qooxdoo_version}`);
     
      let repo_name = argv._[2] || (console.error("No repo name given") || process.exit(1) );
      
      // get compatible tag name
      let tag_name  = releases_cache.get(repo_name+"_latestCompatible") || argv.release;
      if( ! tag_name && ! releases_cache.get(repo_name) ){
          console.error(`'${repo_name}' does not exist, is not a contrib library, or has no compatible release.`);
          process.exit(1);
      }
      // download zip of release
      console.info(`Installing ${repo_name} ${tag_name}`);
      let url = releases_cache.get(repo_name+tag_name).zip_url;
      let contrib_dir = [process.cwd(), "contrib", repo_name.replace(/\//g,"_")+"_"+tag_name ];
      let download_path = contrib_dir.reduce((prev,current)=>{
        let dir = prev + path.sep + current;
        if( ! fs.existsSync(dir) ) fs.mkdirSync(dir);
        return dir;
      });
      if (argv.verbose) console.log(`>>> Downloading ZIP from ${url} to ${download_path}`);
      try {
        await download(url, download_path, {extract:true, strip: 1});
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
      // read libraries array from contrib.json or create new 
      let contrib_json_path = process.cwd() + "/contrib.json";
      let data = fs.existsSync(contrib_json_path) ?
         JSON.parse( fs.readFileSync(contrib_json_path,"utf-8") ) :
         { libraries : [ ] };
      // does the repository name already exist?
      let index = data.libraries.findIndex((elem)=>{
        return elem.name == repo_name;
      });
      let library_elem = {
        name : repo_name,
        version : tag_name,
        path : download_path
      };
      if( index >= 0 ){
        data.libraries[index]=library_elem;
        console.info(`Updating already existing compile.json entry.`);
      } else {
        data.libraries.push(library_elem);
      }
      fs.writeFileSync( contrib_json_path, JSON.stringify(data, null, 2), "utf-8");
      if(argv.verbose) console.info(">>> Done.");
    } catch (e) {
      console.error(e);
    }
  }
};