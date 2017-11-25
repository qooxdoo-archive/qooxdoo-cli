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

require("./Contrib");

const qx = require("qooxdoo");
const fs = require("fs");
const process = require('process');
const path = require('path');
const jsonlint = require("jsonlint");
const semver = require("semver");
const inquirer = require("inquirer");

const MANIFEST_KEY_COMPAT_VERSION_RANGE = "qooxdoo-range";

/**
 * Create a new qooxdoo project. This will assemble the information needed to create the 
 * new project by the following ways, in order of precedence:
 * 1. use parameters passed to the CLI command via the options 
 * 2. if available, retrieve the info from the given environment
 * 3. ask the user the missing values interactively, offering default values where available
 * The variables needed are stored in the templates/template_vars.js file, together
 * with some metadata. 
 * 
 * Issues: automatic determination of qooxdoo path doesn't work yet. 
 */
qx.Class.define("qxcli.commands.Create", {
  extend: qxcli.commands.Contrib,

  statics: {
    getYargsCommand: function() {
      return {
        command: 'create <application namespace> [options]',
        describe: 'creates a new qooxdoo project.',
        builder: {
          "t": {
            alias : "type",
            describe : "Type of the application to create, one of: ['desktop', 'contrib', 'mobile', 'native', 'server', 'website'].'desktop' -- is a standard qooxdoo GUI application; 'contrib' -- is a contribution library with a demo application; 'inline' -- is an inline qooxdoo GUI application; 'mobile' -- is a qooxdoo mobile application with full OO support and mobile GUI classes; 'native' -- is a qooxdoo application with full OO support but no GUI classes; 'server' -- for non-browser run times like Rhino, node.js; 'website' -- can be used to build low-level qooxdoo applications. (Default: desktop)",
            nargs: 1,
            requiresArg: true,
            choices: ['desktop', 'contrib', 'mobile', 'native', 'server', 'website'],
            type: "string",
            default : "desktop"
          },
          "o":{
            alias: 'out',
            describe: 'Output directory for the application content.'
          },
          "s":{
            alias: 'namespace',
            describe: 'Top-level namespace.'
          },
          "n":{
            alias: 'name',
            describe: 'Name of application/library (defaults to namespace).'
          },
          "q":{
            alias: 'qxpath',
            describe: 'Path to the folder containing the qooxdoo framework.',
            default : './qooxdoo/framework'
          },
          "theme":{
            describe: 'The name of the theme to be used.',
            default : 'indigo'
          },
          "icontheme":{
            describe: 'The name of the icon theme to be used.',
            default : 'Oxygen'
          },
          "I":{
            alias : "noninteractive",
            describe: 'Do not prompt for missing values'
          }, 
          "V":{
            alias : "verbose",
            describe: 'Verbose logging'
          }                    
        },
        handler: function(argv) {
          return new qxcli.commands.Create(argv)
            .process()
            .catch((e) => {
              console.error(e.stack || e.message);
            });
        }
      };
    }
  },

  members: {

    /**
     * Creates a new qooxdoo application 
     */
    process: async function() {
      
      // init
      let names = [];
      let argv = this.argv;

      // qooxdoo version 
      let qooxdoo_path, qooxdoo_version;
      try {
        qooxdoo_path = await this.getQooxdooPath(argv);
      } catch (e) {
        qooxdoo_path = path.join( process.cwd(), "qooxdoo/framework")
      }
      try {
        qooxdoo_version = this.getQooxdooVersion(qooxdoo_path);  
      } catch(e){}
      
      // check if skeleton exists
      let template_dir = this.getTemplateDir();
      let skeleton_dir = path.join( template_dir, "skeleton", argv.type );
      if ( ! fs.existsSync( skeleton_dir ) ) {
        this.exit(`Application type ${argv.type} does not exist or has not been implemented yet.`);
      }

      // variables that need to be inserted in the templates including questions
      let data = {
        qooxdoo_path, 
        qooxdoo_version
      };
      let template_vars = require("../../../templates/template_vars")(argv,data);
      let questions = [];
      let values = {};

      for(let var_name in template_vars){
        let v = template_vars[var_name];
        // we have a final value that doesn't need to be asked for / confirmed.
        if( v.value !== undefined ) {
          values[var_name] = v.value;
          continue;
        }
        // do not ask for optional values in non-interactive mode
        if (argv.noninteractive){
          if( v.optional || v.default ){
            values[var_name] = v.default || "";
            continue;
          }
          this.exit(`Cannot skip required value for '${var_name}'.`);
        }
        // ask user
        let message = `Please enter ${v.description} ${v.optional?"(optional)":""}:`;
        questions.push({
          type: "input",
          name: var_name,
          message,
          default: v.default,
          validate : (answer,hash) => { return true} // @todo
        });    
      }
      let answers = await inquirer.prompt(questions);

      // combine preset and query data
      for(let var_name in template_vars){
        if( answers[var_name] !== undefined ){
          values[var_name] = answers[var_name];
        }
      }

      // special cases: locales & authors
      values.locales = JSON.stringify( values.locales.split(/,/).map((locale)=>locale.trim()));
      let authors = values.authors.split(/,/).map((a)=>a.trim());
      values.author_map = JSON.stringify( authors.map((author)=>{
        let parts = author.split(/ /);
        let email = parts.pop();
        return {
          name : parts.join(" "),
          email
        }
      }),null,2);
      values.authors = authors.join("\n"+(" ".repeat(12)));

      // create application folder if it doesn't exist
      let appdir = path.normalize(values.out);
      if( ! fs.existsSync(appdir) ){
        let parentDir = path.dirname(appdir);
        if (! fs.existsSync(parentDir) ) this.exit(`Invalid directory ${appdir}`);
        try{
          fs.accessSync(parentDir,fs.constants.W_OK);
        } catch(e){
          this.exit(`Directory ${parentDir} is not writable.`);
        }
        fs.mkdirSync(appdir);
      }
    
      // copy template, replacing template vars
      function traverseFileSystem(sourceDir,targetDir){
        let files = fs.readdirSync(sourceDir);
        for (let i in files) {
          let part = files[i];
          let sourceFile = path.join(sourceDir, part);
          let stats = fs.statSync(sourceFile);
          if (stats.isFile() ) {
            let targetFile = path.join(targetDir, part.replace(/\.tmpl/,""));
            if ( sourceFile.includes(".tmpl") ) {
              // template file
              let template = fs.readFileSync(sourceFile,"utf-8");
              for( let var_name in values ){
                template = template.replace(new RegExp(`\\$${var_name}`,"g"), values[var_name] );
              }
              if (argv.verbose) console.info(`>>> Creating ${targetFile} from template ${targetFile}...`);
              //console.log(template);
              if( fs.existsSync(targetFile) ){
                this.exit(`${targetFile} already exists.`); // todo: handle overwriting
              }
              fs.writeFileSync(targetFile,template,"utf-8");
            } else {
              // normal file
              if( argv.verbose) console.info(`>>> Copying ${sourceFile} to ${targetFile}...`);
              fs.copyFileSync( sourceFile, targetFile );
            }
          } else if (stats.isDirectory()) {
            if( part == "custom" ) part = values.namespace;
            let newTargetDir = path.join(targetDir,part);
            fs.mkdirSync(newTargetDir);
            traverseFileSystem(sourceFile,newTargetDir);
          }
        }
      }

      // go
      traverseFileSystem.bind(this)( skeleton_dir, appdir ); 
    }
  }
});
