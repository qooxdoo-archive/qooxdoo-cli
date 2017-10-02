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
const process = require('process');
const Search = require('github-api/dist/components/Search');
const Repository = require('github-api/dist/components/Repository');
const jsonlint = require("jsonlint");

/**
 * Updates the local cache with information of available contrib libraries
 */
qx.Class.define("qxcli.commands.contrib.Update", {
  extend: qxcli.commands.Contrib,

  statics: {
    getYargsCommand: function() {
      return {
        command: 'update [repository]',
        describe: 'updates information on contrib libraries from github. Has to be called before the other commands.',
        builder: {},
        handler: function(argv) {
          return new qxcli.commands.contrib.Update(argv)
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
     * Updates the cache with information from GitHub.
     */
    process: async function() {
      
      // init
      let names = [];
      let num_libraries = 0;
      const argv = this.argv;
      const update_repo_only = argv.repository;
      if (!update_repo_only) this.clearCache();

      // authentication
      const auth = {};
      if (argv.token) {
        auth.token = argv.token;
      }
      const search = new Search({}, auth);

      // qooxdoo-contrib repositories
      if( ! argv.quiet ) console.log("Searching for qooxdoo-contrib repositories on GitHub...");
      let result = await search.forRepositories({ q: 'topic:qooxdoo-contrib fork:true' });
      let repos_data = this.getCache().repos.data;

      // iterate over repositories
      for (let repo of result.data) {
        let name = repo.full_name;
        // if a repository name has been given, only update this repo
        if (update_repo_only && name != update_repo_only) continue;
        if (argv.verbose) console.info(`### Found ${name} ...`);
        names.push(name);
        let repository = new Repository(name, auth);
        repos_data[name] = {
          description: repo.description,
          url: repo.url,
          releases: {
            list: [],
            data: {}
          }
        };

        // get releases
        try {
          var releases_data = await repository.listReleases();
        }
        catch (e) {
          console.error("Error retrieving releases: " + e);
          continue;
        }
        if (argv.verbose) console.info(`>>> ${name} has ${releases_data.data.length} release(s).`);

        // get Manifest.json of each release to determine compatible qooxdoo versions
        for (let release of releases_data.data) {
          let tag_name = release.tag_name;
          let releases = repos_data[name].releases;

          // list of paths to manifest files, default is Manifest.json in the root dir
          let manifests = [{ path: "Manifest.json" }];

          // can be overridden by a qoxdoo.json in the root dir
          let qooxdoo_data;
          if (argv.verbose) console.log(`>>> Trying to retrieve 'qooxdoo.json' for ${name} ${tag_name}...`);
          try {
            // @todo check if the method can return JSON to save parsing
            qooxdoo_data = await repository.getContents(tag_name, "qooxdoo.json", true);
            if (argv.verbose) console.log(`    File exists, checking for libraries...`);
            let data = qooxdoo_data.data;
            if (typeof data == "string") {
              try {
                data = jsonlint.parse(data);
              } catch (e) {
                if (argv.verbose) {
                  console.warn(`     Parse error: ${e.message}`);
                }
              }
            }
            // we have a list of Manifest.json paths!
            if (data.contribs && data.contribs instanceof Array) {
              manifests = data.contribs;
            }            
          } catch (e) {
            // no Qooxdoo.json
            if (e.message.match(/404/)) {
              if (argv.verbose) console.warn(`    File does not exist.`);
            } else {
              if (argv.verbose) console.warn(`    Error: ${e.message}`);
            }
          }

          // create a list of contribs via their manifests
          for (let [index, { path }] of manifests.entries()) {
            let manifest_data;
            if (path !== "Manifest.json") {
              if (path.substr(0, 2) == "./") {
                path = path.substr(2);
              }
              path += "/Manifest.json";
            }
            try {
              if (argv.verbose) console.log(`>>> Retrieving Manifest file '${path}' for ${name} ${tag_name}...`);
              manifest_data = await repository.getContents(tag_name, path, true);
            }
            catch (e) {
              if (e.message.match(/404/)) {
                if (argv.verbose) console.warn(`    File does not exist.`);
              }
              else {
                if (argv.verbose) console.warn(`    Error: ${e.message}`);
              }
              continue;
            }
            // retrieve compatible qooxdoo versions
            let data = manifest_data.data;
            // todo see above
            if (typeof data == "string") {
              try {
                data = jsonlint.parse(data);
              }
              catch (e) {
                if (argv.verbose) {
                  console.warn(`    Parse error: ${e.message}`);
                  console.log(data);
                }
                continue;
              }
            }
            try {
              var qx_versions = data.info["qooxdoo-versions"];
            }
            catch (e) {
              if (argv.verbose) {
                console.warn(`   Error reading qooxdoo-versions: ${e}.`);
              }
              continue;
            }
            if (qx_versions instanceof Array) {
              // provide backwards-compatibility
              qx_versions = qx_versions.join(" || ");
            }
            let info = data.info;
            manifests[index] = { path, qx_versions, info };
            num_libraries++;
            if (argv.verbose) {
              console.log(`>>> ${name} ${tag_name}: Found '${info.name}' contrib (compatible with ${qx_versions})`);
            }
            else {
              // output dots to indicate progress
              if (!argv.quiet) process.stdout.write(".");
            }
          } // end iteration over manifests
          // save data in cache
          let zip_url = `https://github.com/${name}/archive/${tag_name}.zip`;
          releases.list.push(tag_name);
          releases.data[tag_name] = {
            title: release.name,
            prerelease: release.prerelease,
            manifests,
            zip_url
          };          
        } // end iteration over releases
      } // end iteration over repos
      
      // wrap-up
      if (!update_repo_only) this.getCache().repos.list = names.sort();
      if (!argv.quiet) {
        if (!argv.verbose) process.stdout.write("\n");
        console.info(`Found ${num_libraries} libraries. Run the 'list' command to see which ones are compatible with your project.`);
      }
      
      // save cache
      if( argv.file ){
        this.exportCache(argv.file); 
      } else {
        this.saveCache();  
      }
    }
  }
});
