const Cache = require('../../lib/cache');
const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const rimraf = require('rimraf');

module.exports = {
  command   : 'remove',
  describe  : 'removes a contrib library from the configuration.',
  builder   : {},
  handler   : async function(argv){
    const releases_cache = new Cache('releases');
    try {
      let repo_name = argv._[2] || (console.error("No repo name given") && process.exit(1) );
    
      // read libraries array from contrib.json or create new 
      let contrib_json_path = process.cwd() + "/contrib.json";
      let data = fs.existsSync(contrib_json_path) ?
         JSON.parse( fs.readFileSync(contrib_json_path,"utf-8") ) :
         { libraries : [ ] };
    
      // does the repository name already exist?
      let index = data.libraries.findIndex((elem)=>{
        return elem.name == repo_name;
      });
      
      if( index >= 0 ){
        rimraf.sync(data.libraries[index].path);
        data.libraries.splice(index,1);
        console.warn(`Deleted entry and files for ${repo_name}`);
      } else if(argv.verbose) {
        console.warn(`No entry for ${repo_name}`);
      }
      fs.writeFileSync( contrib_json_path, JSON.stringify(data, null, 2), "utf-8");
      
    } catch (e) {
      console.error(e);
    }
  }
};
