const process = require("process");
const path = require("path");
const fs = require("fs");

module.exports = function(argv,data){
  return {
    "type" : {
      "type": "list",
      "choices": function() {
         // check if skeleton exists
         let skeleton_dir = path.join( data.template_dir, "skeleton");
         const dirs = p => fs.readdirSync(skeleton_dir).filter(f => fs.statSync(path.join(skeleton_dir, f)).isDirectory());
         return dirs();        
      },
      "description" : "type of the application:",
      "default" : "desktop",
      "validate" : function(answer) {
        // check if skeleton exists
        let skeleton_dir = path.join( data.template_dir, "skeleton", answer );
        if ( ! fs.existsSync( skeleton_dir ) ) {
          this.exit(`\nApplication type <${answer}> does not exist or has not been implemented yet.`);
        }
        data.skeleton_dir = skeleton_dir;
        return true;
      }
    },  
    "qxpath" : {
      "description" : "the absolute path to the qooxdoo folder",
//      "value" : data.qooxdoo_path || undefined, // doesn't work
      "default" : data.qooxdoo_path,
      "validate" : function(answer) {
        // check if qooxdoo exists
        if ( ! fs.existsSync( answer ) ) {
          this.exit(`\no valid qooxdoo path: <${answer}>.`);
        }
        try {
          data.qooxdoo_version = this.getQooxdooVersion(answer);  
        } catch(e){
          this.exit(e.message);
        }
        return true;
      }
    },  
    "namespace" : {
      "description" : "the namespace of the application",
      "value" : argv.applicationnamespace
    },
    "out" : {
      "description" : "the output directory for the application content (use '.' if no subdirectory should be created)",
      "value" : argv.out,
      "default" : path.join( process.cwd() , argv.applicationnamespace )
    },      
    "name" : {
      "description" : "the name of the application",
      "optional" : true,
      "value" : argv.name,
      "default" : argv.applicationnamespace,
    },
    "summary" : {
      "description" : "a short summary of what the application does",
      "optional" : true
    },
    "description" : {
      "description" : "a longer description of the features of the application",
      "optional" : true
    },
    "authors" : {
      "description" : "the name of the authors, in the following format: full name (github-id) email-address, divided by comma",
      "optional" : true
    },
    "locales" : {
      "description" : "the locales the application uses, as language codes (en, de, fr, etc.), divided by comma",
      "default" : "en"
    },
    "homepage" : {
      "description" : "a webpage with more information on the application",
      "optional" : true
    },      
    "license" : {
      "description" : "the license of the application",
      "default" : "MIT license"
    },
    "year" : {
      "description" : "the year(s) of the copyright",
      "optional" : true,
      "default" :  (new Date).getFullYear(),
    },
    "copyright_holder" : {
      "description" : "the holder of the copyright for the code",
      "optional" : true
    },   
    "version" : {
      "description" : "the version of the application, in semver format",
      "default" : "1.0.0"
    },
    "qooxdoo_range" : {
      "description" : "the semver range of qooxdoo versions that are compatible with this application",
      "default" : function() {
        return data.qooxdoo_version;
      }  
    },
    "theme": {
      "description" : "the theme of the application",
      "default" : argv.theme
    },
    "icon_theme": {
      "description" : "the icon theme of the application",
      "default" : argv.icontheme
    },    
  }
}