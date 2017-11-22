const process = require("process");
const path = require("path");

module.exports = function(argv,data){
  return {
    "qxpath" : {
      "description" : "the absolute path to the qooxdoo folder",
      //"value" : data.qooxdoo_path || undefined, // doesn't work
      "default" : path.normalize(argv.qxpath)
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
      "default" : data.qooxdoo_version 
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