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

const qx = require("qooxdoo");
const qxcompiler = require('qxcompiler');
const fs = require('fs');
const path = require('path');
const JsonToAst = require("json-to-ast");
const chokidar = require('chokidar');

require("../Utils");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

qx.Class.define("qxcli.commands.Watch", {
  extend: qx.core.Object,
  
  construct: function(maker) {
    this.base(arguments);
    this.__maker = maker;
  },
  
  members: {
    __runningPromise: null,
    __applications: null,
    
    start: function() {
      if (this.__runningPromise)
        throw new Error("Cannot start watching more than once");
      this.__runningPromise = qxcli.Utils.newExternalPromise();
      
      var dirs = [];
      this.__maker.getAnalyser().getLibraries().forEach(function(lib) {
        var dir = path.join(lib.getRootDir(), lib.getSourcePath());
        dirs.push(dir);
      });
      var applications = this.__applications = [];
      this.__maker.getApplications().forEach(function(application) {
        var data = {
            application: application,
            dependsOn: {},
            outOfDate: false
        };
        applications.push(data);
      }.bind(this));
      var watcher = this._watcher = chokidar.watch(dirs, {
        ignored: /(^|[\/\\])\../
      });
      watcher.on("change", this.__onFileChange.bind(this));
      this.__make();
    },
    
    stop: function() {
      this._watcher.close();
    },
    
    __make: function() {
      if (this.__making)
        return;
      this.fireEvent("making");
      var t = this;
      this.__making = true;
      this.__outOfDate = false;
      
      function make() {
        t.info(">>> Making the applications...")
        t.__maker.make(function() {
          if (this.__outOfDate) {
            setImmediate(function() {
              t.fireEvent("remaking");
              make();
            });
          } else {
            t.__making = false;
            var analyser = t.__maker.getAnalyser();
            var db = analyser.getDatabase();
            t.__applications.forEach(function(data) {
              data.dependsOn = {};
              data.application.__loadDeps.forEach(function(classname) {
                var info = db.classInfo[classname];
                var lib = analyser.findLibrary(info.libraryName);
                var parts = [ lib.getRootDir(), lib.getSourcePath() ].concat(classname.split('.'));
                var filename = path.resolve.apply(path, parts) + ".js";
                data.dependsOn[filename] = true;
              });
            });
            t.fireEvent("made");
          }
        });
      }
      
      make();
    },
    
    __scheduleMake: function() {
      if (!this.__making) {
        if (this.__timerId)
          clearTimeout(this.__timerId);
        this.__timerId = setTimeout(function() {
          this.__make();
        }.bind(this, 500));
      }
    },
    
    __onFileChange: function(path) {
      this.debug("Change: " + path);
      if (this.__outOfDate)
        return;
      this.__applications.forEach(function(data) {
        if (data.dependsOn[path]) {
          this.__outOfDate = true;
        }
      }.bind(this));
      if (this.__outOfDate)
        this.__scheduleMake();
    },
    
    __onStop: function() {
      this.__runningPromise.resolve();
    }
  }
});