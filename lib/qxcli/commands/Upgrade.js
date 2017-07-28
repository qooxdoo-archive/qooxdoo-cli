/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Zenesis Ltd

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)

************************************************************************ */

const {promisify} = require('util');

const spawn = require('child_process').spawn;
const fs = require("fs");
const path = require("path");
const process = require("process");
const JsonToAst = require("json-to-ast");
const qx = require("qooxdoo");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

require("./Command");

/**
 * Command to initialise a new qooxdoo application, or upgrade an old (pre-6.0) application
 * 
 */
qx.Class.define("qxcli.commands.Upgrade", {
  extend: qxcli.commands.Command,
  
  members: {
    /*
     * @Override
     */
    process: async function() {
      var t = this;
      var ast = null;
      var qxcompileJson = {};
      var configJson;
      
      var lets = {};
      function getMacro(name) {
        var value = lets[name];
        value = replaceMacros(value);
        return value;
      }
      
      function replaceMacros(value) {
        if (!value)
          return "";
        while (true) {
          var pos = value.indexOf('${');
          var endPos = value.indexOf('}', pos);
          if (pos < 0 || endPos < 0)
            return value;
          var name = value.substring(pos + 2, endPos);
          var left = value.substring(0, pos);
          var right = value.substring(endPos + 1);
          value = left + lets[name] + right;
        }
      }
      
      function parseJson(str) {
        var ast = JsonToAst.parseToAst(str);
        var json = JsonToAst.astToObject(ast);
        return json;
      }
      
      t.debug(">>> Loading config.json");
      var data = await readFile("config.json", {encoding: "utf8"});
      configJson = parseJson(data);
      
      t.debug(">>> Loading qxcompiler.json (if there is one)")
      try {
        var data = await readFile("compile.json", {encoding: "utf8"});
        
        ast = JsonToAst.parseToAst(data, { verbose: true });
        qxc = JsonToAst.astToObject(ast);
      } catch(err) {
        if (err.code !== "ENOENT")
          throw err;
      }
      
      t.debug(">>> Loading Manifest.json");
      var str = await readFile("Manifest.json", { encoding: "utf8" });
      data = parseJson(str);
      
      lets = configJson["let"]||{};
      qxcompileJson = Object.assign({
        targets: [
          {
            "type": "source",
            "outputPath": "source-output"
          },
          {
            "type": "hybrid",
            "outputPath": "hybrid-output"
          },
          {
            "type": "build",
            "outputPath": "build-output"
          }
        ],
        defaultTarget: "source",
        locales: getMacro("LOCALES")|| ["en"],
        applications: [],
        libraries: []
      }, qxcompileJson);
      
      if (!qxcompileJson.defaultTarget) {
        const MAP_JOB_TO_TARGET = {
            "source": "source",
            "source-hybrid": "hybrid",
            "build": "build"
        };
        qxcompileJson.defaultTarget = MAP_JOB_TO_TARGET[configJson["default-job"]]||"source";
      }
      
      var appName = getMacro("APPLICATION");
      var appClass = getMacro("APPLICATION_CLASS");
      if (!appClass)
        appClass = appName + ".Application";
      var qxTheme = getMacro("QXTHEME");
      
      t.debug(">>> Loading known library manifests");
      var libLookup = {};
      
      function addLibrary(ns, dir) {
        var lib = {
            path: dir
          };
        libLookup[ns] = lib;
        qxcompileJson.libraries.push(lib);
        return lib;
      }
      
      await Promise.all(qxcompileJson.libraries.map(function(lib) {
        return readFile(lib.path + "/Manifest.json")
          .then(function(data) {
            data = parseJson(data);
            var ns = data.provides.namespace;
            t.debug("    > Loaded " + ns);
            libLookup[ns] = {
              manifest: data,
              path: lib.path
            };
          })
      }));
      
      if (configJson.jobs && configJson.libraries && configJson.libraries.library) {
        t.debug(">>> Loading extra library manifests")
        var all = configJson.libraries.library.map(async (clib) => {
          var filename = getMacro(clib.manifest);
          var pos = filename.lastIndexOf('/');
          var dir = filename.substring(pos + 1);
          var str = await readFile(filename, { encoding: "utf8" });
          var manifest = parseJson(str);
          var ns = manifest.provides.namespace;
          t.debug("    > Loaded " + ns);
          var lib = libLookup[ns];
          if (!lib) {
            addLibrary(ns, dir);
          }
        });
        await Promise.all(all);
      }

      console.log(">>> Configuring");
      if(!libLookup["qx"]) {
        var dir = getMacro("QOOXDOO_PATH");
        if (!dir)
          t.error("Cannot find Qooxdoo");
        else
          addLibrary("qx", path.join(dir, "framework"));
      }
      
      if (!libLookup[appName]) {
        addLibrary(appName, ".");
      }
      
      if (!qxcompileJson.applications.length) {
        qxcompileJson.applications.push({
          "class": appClass,
          theme: qxTheme,
          name: appName
        });
      }

      var str = JsonToAst.reprint(qxcompileJson, ast);
      await writeFile("compile.json", str, { encoding: "utf8" });
      console.log(">>> Done.");
    }
    
  }
});

