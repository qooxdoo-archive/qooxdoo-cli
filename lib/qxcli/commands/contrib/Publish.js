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

require("../Contrib");

const qx = require("qooxdoo");
const fs = require("fs");
const process = require('process');
const Repository = require('github-api/dist/components/Repository');
const jsonlint = require("jsonlint");
const semver = require("semver");
const inquirer = require("inquirer");

const MANIFEST_KEY_COMPAT_VERSION_RANGE = "qooxdoo-range";
const ENV_GH_ACCESS_TOKEN = "GITHUB_ACCESS_TOKEN";

/**
 * Publishes a release on GitHub
 */
qx.Class.define("qxcli.commands.contrib.Publish", {
  extend: qxcli.commands.Contrib,

  statics: {
    getYargsCommand: function() {
      return {
        command: 'publish',
        describe: 'publishes a new release of the contrib on GitHub. Requires a GitHub access token. By default, makes a patch release.',
        builder: {
          "t": {
            alias : "type",
            describe: "Set the release type",
            nargs: 1,
            requiresArg: true,
            choices: "major,premajor,minor,preminor,patch,prepatch,prerelease".split(/,/),
            type: "string",
            default : "patch"
          },
          "S":{
            alias: "simulate",
            describe: 'Simulate a release, but do not actually make it.'
          },
          "y":{
            alias: "non-interactive",
            describe: 'Do not prompt user'
          }
        },
        handler: function(argv) {
          return new qxcli.commands.contrib.Publish(argv)
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
     * Publishes a new release of the contrib on GitHub, by executing the following steps:
     * 
     * 1. In Manifest.json, update the qooxdoo-range value to include the version of the qooxdoo 
     *    framework (As per version.txt).
     * 2. In Manifest.json, based the given options, increment the version number (patch, 
     *    feature, breaking). 
     * 3. Create a release with the tag vX.Y.Z according to the current version.
     * 
     */
    process: async function() {
      
      // init
      let names = [];
      const argv = this.argv;

      // qooxdoo version 
      let qooxdoo_path = await this.getQooxdooPath(argv);
      if(argv.verbose) console.log(`>>> qooxdoo path:     ${qooxdoo_path}`);
      let qooxdoo_version = this.getQooxdooVersion(qooxdoo_path);
      if(argv.verbose) console.log(`>>> qooxdoo version:  ${qooxdoo_version}`);      

      // token
      let token = argv.token || process.env[ENV_GH_ACCESS_TOKEN];
      if( ! token ){
        console.error(`GitHub access token required. Pass it via --token or set the environment variable ${ENV_GH_ACCESS_TOKEN}`);
        process.exit(1);
      }

      // read Manifest.json
      let manifest_path = process.cwd() + "/Manifest.json";
      if( ! fs.existsSync(manifest_path) ) {
        console.error("Cannot find Manifest.json - are you in the project directory?");
        process.exit(1);
      }

      // read package.json
      let package_path = process.cwd() + "/package.json";
      if( ! fs.existsSync(package_path) ) {
        console.error("Cannot find package.json - is this a");
        process.exit(1);
      }      

      let manifest = jsonlint.parse( fs.readFileSync(manifest_path,"utf-8") );
      let old_version = manifest.info.version;
      let new_version = semver.inc( old_version, argv.type );
      if( ! new_version ) {
        console.error("Cannot parse version number in Manifest. Please provide a valid version in the x.y.z format.");
        process.exit(1);

      }

      // prompt user to confirm
      let doRelease = true;
      if( ! argv.y ){
        let question = {
          type: "confirm",
          name: "doRelease",
          message: `Release version ${new_version} of ${manifest.info.name}?`,
          default: "y"
        };
        let { doRelease } = await inquirer.prompt(question);
      }
      if ( ! doRelease ) process.exit(0);

      // update Manifest.json
      manifest.info.version = new_version;
      // qooxdoo-versions @deprecated
      let qooxdoo_versions = manifest.info["qooxdoo-versions"];
      if( qooxdoo_versions instanceof Array ){
        if( ! qooxdoo_versions.includes(qooxdoo_version) ){
          manifest.info["qooxdoo-versions"].push(qooxdoo_version);
        }
      }
      // qooxdoo-range
      let semver_range = manifest.info[MANIFEST_KEY_COMPAT_VERSION_RANGE] || "";
      if( ! semver.satisfies( qooxdoo_version, semver_range, true ) ){
        semver_range += ( semver_range ? " || " : "" ) + qooxdoo_version;
        manifest.info[MANIFEST_KEY_COMPAT_VERSION_RANGE] = semver_range;
      }
      fs.writeFileSync( manifest_path, JSON.stringify(manifest, null, 2), "utf-8");
      // commit and push
      // ...
      // do release
      //let repository = new Repository(name, {token : argv.token});
    }
  }
});
