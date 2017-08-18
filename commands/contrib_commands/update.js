'use strict';
const Cache = require('../../lib/cache');
const Search = require('github-api/dist/components/Search');
const Repository = require('github-api/dist/components/Repository');
const process = require('process');

module.exports = {
  command   : 'update',
  describe  : 'updates information on contrib libraries from github. Has to be called before the other commands.',
  builder   : {},
  handler   : async function(argv){
    const repo_cache     = new Cache('repos');
    const releases_cache = new Cache('releases');

    // qooxdoo-contrib repositories
    console.log("Searching for repositories on GitHub...");
    const auth = { }
    if (argv.token) {
      auth.token = argv.token
    }
    const search = new Search({}, auth);
    var result = await search.forRepositories({q:'topic:qooxdoo-contrib'});
    var repos = result.data;
    let names = [];
    let repo_name = argv._[2];
    
    // if no repo name has been given, clear the repo cache
    if( ! repo_name ) {
      repo_cache.clear();
    }
    
    // iterate over repositories and releases
    for ( let repo of repos ) {
      let name = repo.full_name;
      
      // if a repository name has been given, only update this repo
      if(repo_name && name != repo_name) continue;
      
      names.push(name);
      let repository = new Repository(name, auth);
      // get releases
      try {
        var releases = await repository.listReleases();
      } catch (e) {
        console.error("Error retrieving releases: " +e);
        continue;
      }
      if(argv.verbose) console.info(`>>> ${name} has ${releases.data.length} releases.`);

      // get Manifest.json of each release to determine compatible qooxdoo versions
      for ( let release of releases.data ) {
        var tag_name = release.tag_name;
        repo_cache.set(name,{
          description : repo.description,
          url : repo.url,
          num_releases : releases.data.length,
          tag_names : []
        });        
        try{
          var manifest = await repository.getContents(tag_name,"Manifest.json",true);
        } catch (e) {
          if( e.message.match(/404/) ){
            if(argv.verbose) console.warn(`>>> ${name} ${tag_name} does not have a manifest file at the default location.`);
          } else {
            if(argv.verbose) console.warn(`>>> Error retrieving manifest for ${name} ${tag_name}: ${e.message}`);
          }
          continue;
        }
        // retrieve compatible qooxdoo versions
        let data = manifest.data;
        if( typeof data == "string" ){
          try {
              data = JSON.parse(data);
          } catch (e){
            if(argv.verbose) {
              console.warn(`>>> Error parsing Manifest of ${name} ${tag_name}: ${e.message}`);
              console.log(data);
            }
          }
        }
        try {
          var qx_versions = data.info["qooxdoo-versions"];
        } catch (e) {
          if(argv.verbose) {
            console.warn(`>>> Error reading qooxdoo-versions from manifest for ${name} ${tag_name}.`);
          }
          continue;
        }
        if( qx_versions instanceof Array ){
          // provide backwards-compatibility
          qx_versions = qx_versions.join(" || ");
        }
        // downloadable ZIP
        let zip_url = `https://github.com/${name}/archive/${tag_name}.zip`;
        // cache release data
        releases_cache.set(name + tag_name, {
          title : release.name,
          prerelease : release.prerelease,
          qx_versions,
          zip_url
        });
        let repo_info = repo_cache.get(name);
        repo_info.tag_names.push(tag_name);
        repo_cache.set(name,repo_info);
        if (argv.verbose) {
          console.log(`>>> compatible qooxdoo versions for ${name} ${tag_name}: ${qx_versions}`);
        } else {
          process.stdout.write(".");
        }
      }
    }
    repo_cache.set("__list__", names.sort());
    if (!argv.verbose) process.stdout.write("\n");
    console.info(`Found ${names.length} libraries. Run the 'list' command to see which ones are compatible with your project.`);
  }
};
