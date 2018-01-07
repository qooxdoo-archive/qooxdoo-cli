/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Christian Boulanger and others

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */

/*global qx qxcli*/

const qx = require("qooxdoo");
const fs = require("fs");
const process = require('process');
const path = require('upath');
const jsonlint = require("jsonlint");
const {promisify} = require('util');
const JsonToAst = require("json-to-ast");
const readFile = promisify(fs.readFile);

require("./Command");

/**
 * Add a new class file to the current project, based on a template.
 * Syntax: `qx add template_name class_name [--extend=extended_class]`
 * The path to the template file will be calculated as follows:
 * 1. transform template_name to ${template_name}.tmpl.js
 * 2. if template_name is of the form "foo/bar", check for this file in the 
 *    "templates/class" folder of the "foo" contrib
 * 3. otherwise, check in the "templates/class" folder 
 *    a. of the current project
 *    b. of the CLI library
 *    and use the first file that exists.
 * 
 */
qx.Class.define("qxcli.commands.Add", {
  extend: qxcli.commands.Command,
  statics: {
    getYargsCommand: function() {
      return {
        command: 'add <template> <classname> [options]',
        describe: 'adds a new class file to the current project, based on a template.',
        builder: {
          "extend":{
            alias : "e",
            describe: 'the class to extend'
          }           
          // "verbose":{
          //   alias : "v",
          //   describe: 'Verbose logging'
          // }                    
        },
        handler: function(argv) {
          return new qxcli.commands.Add(argv)
            .process()
            .catch((e) => {
              console.error(e.stack || e.message);
              process.exit(1);
            });
        }
      };
    }
  },

  members: {
    process: async function() {
      let argv = this.argv;

      // read Manifest.json
      let manifestPath = path.join( process.cwd(), "Manifest.json" );
      if( ! await fs.existsAsync( manifestPath )){
        throw new qxcli.Utils.UserError("No Manifest.json file in this directory. Please go to the your project root.");
      }
      let manifestJson = await this.parseJsonFile(manifestPath);
      
      // prepare template vars
      let values = Object.assign({}, manifestJson.info, manifestJson.provides );
      // @todo Add support for authors, ask interactively if author info should be taken
      // from Manifest or entered manually, then create string representation to insert.
      values.authors = "";
      values.classname = argv.classname;
      values.extend = argv.extend ? argv.extend : "qx.core.Object";
      
      // @todo ask interactively for copyright holder, create a setting in Manifest.json
      values.copyright = (new Date).getFullYear();

      // check top-level namespace
      let class_namespaces = argv.classname.split(/\./);
      if( class_namespaces[0] !== values.namespace ){
        throw new qxcli.Utils.UserError(`Invalid top namespace '${class_namespaces[0]}'. Must be '${values.namespace}'.`);
      }   

      // get path to the template file
      let template_name = argv.template;
      let template_path;
      let potential_dirs = [
        // 1. in the templates/class dir of the current project
        path.join( process.cwd(), "templates"),
        // 2. in the templates/class dir of cli
        this.getTemplateDir()
        // 3. @todo: in a contrib library's templates dir
      ];
      let found = false;
      for( let dir of potential_dirs ){
        template_path = path.join( dir, "class", template_name + ".tmpl.js");
        if ( await fs.existsAsync( template_path ) ){
          found = true; break; 
        }
      }
      if( ! found ){
        throw new qxcli.Utils.UserError(`Template ${template_name} does not exist.`);
      }

      // replace template vars
      let template = await fs.readFileAsync(template_path,"utf-8");
      for( let var_name in values ){
        template = template.replace(new RegExp(`\\$\{${var_name}\}`,"g"), values[var_name] );
      }
      // write out new class file
      let relative_path = path.join( "source", "class", ...class_namespaces ) + '.js';
      let absolute_path = path.join( process.cwd(), relative_path );  
      try {
        require('mkdirp').sync( path.dirname( absolute_path ), 0o755 );
        await fs.writeFileAsync( absolute_path, template, "utf-8")
      } catch(e){
        throw new qxcli.Utils.UserError(`Cannot write ${absolute_path}: ${e.message}` );
      }
    }
  }
});
