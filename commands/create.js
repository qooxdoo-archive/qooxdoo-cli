/**
 Script to create a new qooxdoo application.

Example: For creating a qooxdoo application 'myapp' you could execute:
  qx create <type> myapp


                        
not implemented:                         
  -l LOGFILE, --logfile=LOGFILE
                        Log file
  -p PATH, --skeleton-path=PATH
                        (Advanced) Path where the script looks for skeletons.
                        The directory must contain sub directories named by
                        the application types. (Default:
                        /Users/cboulanger/Code/qooxdoo/component/skeleton)
  --cache=PATH          Path to the cache directory; will be entered into
                        config.json's CACHE macro (Default:
                        ${TMPDIR}/qx${QOOXDOO_VERSION}/cache)
*/

/*
*/
const spawn = require('child_process').spawn;
const fs = require("fs");
const path = require("path");
const process = require("process");
const rimraf = require('rimraf');

exports.command = "create <application name> [options]";
exports.desc = "creates a qooxdoo application skeleton";
exports.usage = "Creates a qooxdoo application skeleton.";
exports.builder = function (yargs) {
  return yargs
    .option('t', {
        alias : 'type',
        describe : "Type of the application to create, one of: ['desktop', 'inline', 'mobile', 'native', 'server', 'website'].'desktop' -- is a standard qooxdoo GUI application; 'inline' -- is an inline qooxdoo GUI application; 'mobile' -- is a qooxdoo mobile application with full OO support and mobile GUI classes; 'native' -- is a qooxdoo application with full OO support but no GUI classes; 'server' -- for non-browser run times like Rhino, node.js; 'website' -- can be used to build low-level qooxdoo applications. (Default: desktop)",
        default: 'desktop'
    })
    .option('o', {
        alias: 'out',
        describe: 'Output directory for the application folder',
        default : '.'
    })       
    .option('s', {
        alias: 'namespace',
        describe: 'Applications\'s top-level namespace.'
    })     
    .option('q', {
        alias: 'qxpath',
        describe: 'Path to the folder containing the qooxdoo framework.',
        default : './qooxdoo'
    })
    .option('v', {
        alias: 'verbose',
        describe: 'verbose logging'
    })
    .option('legacy', {
        describe: 'keep legacy python toolchain files',
		default: false
    })  
    .showHelpOnFail()
}
exports.handler = function (argv) {
  
  let { qxpath, type, out, namespace, applicationname, verbose, legacy } = argv;


  const script_path = `${qxpath}/tool/bin/create-application.py`;
  if ( ! fs.existsSync(script_path) ){
    console.error("Cannot find create-application.py script. Check your --qxpath value.");
    process.exit(1);
  }
  namespace = namespace||applicationname.toLowerCase().replace(/ /,"_");
  let args = [script_path,`--name=${applicationname}`,`--type=${type}`,`--out=${out}`,`--namespace=${namespace}`];
  let opts = { env: process.env };
  
  console.log(">>> Creating skeleton...");
  let exe = spawn("python", args , opts);
  
  // suppress all output unless in verbose mode
  if(verbose){
    exe.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    exe.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  }
  exe.on('close', (code) => {
    if( code != 0 ){
      console.error("create-application.py exited with an error, use --verbose to debug.");
      process.exit(code);
    }
    // cleanup
    rimraf.sync(`${out}/${namespace}/node_modules` );
    if( verbose) {
        console.log("Deleted node_modules");
    }
    let files = ["Gruntfile.js","package.json","package-lock.json"];

    if( !legacy ) {
      files = files.concat(["config.json","generate.py"]);
    }

    for( let file of files){
      let filePath = `${out}/${namespace}/${file}`;
      fs.existsSync(filePath)
        && fs.unlinkSync(filePath) 
        || verbose &&  console.log(`Deleted ${file}`);
    }
    
    console.log(">>> Adapting skeleton for qxcompiler...");
    // Copy over adapted compile.json template
	// Copy over adapted compile.json template
    let compile_json_path = `${path.dirname(__dirname)}/templates/compile.json`;
    let compile_json_content = fs.readFileSync(compile_json_path,"utf-8")
    .replace(/\$namespace/g,namespace)
    .replace(/\$qxpath/g,path.resolve(qxpath).replace(new RegExp('\\' + path.sep, 'g'), '/'));
    fs.writeFileSync(`${out}/${namespace}/compile.json`, compile_json_content, "utf-8");
    
    console.log(">>> Done.");
  });
}