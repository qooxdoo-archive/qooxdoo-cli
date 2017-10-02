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
    this.__stats = {
      classesCompiled: 0  
    };
  },
  
  members: {
    __runningPromise: null,
    __applications: null,
    
    start: function() {
      if (this.__runningPromise)
        throw new Error("Cannot start watching more than once");
      this.__runningPromise = qxcli.Utils.newExternalPromise();
      
      var dirs = [];
      var analyser = this.__maker.getAnalyser();
      analyser.addListener("classCompiled", function() {
        this.__stats.classesCompiled++;
      }, this);
      analyser.getLibraries().forEach(function(lib) {
        var dir = path.join(lib.getRootDir(), lib.getSourcePath());
        dirs.push(dir);
        var dir = path.join(lib.getRootDir(), lib.getBootPath());
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
      
      function formatTime(millisec) {
        var seconds = Math.floor(millisec / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        millisec = millisec % 1000;
        
        var result = "";
        if (hours) {
          result += ((hours > 9) ? hours : "0" + hours) + "h ";
        }
        if (hours || minutes) {
          result += ((minutes > 9) ? minutes : "0" + minutes) + "m ";
        }
        result += ((seconds > 9) ? seconds : "0" + seconds) + "." + 
          ((millisec > 99) ? "" : millisec > 9 ? "0" : "00") + millisec + "s";
        return result;
      }
      
      function make() {
        t.info(">>> Making the applications...")
        var startTime = new Date().getTime();
        t.__stats.classesCompiled = 0;
        t.__outOfDate = false;
        t.__maker.make(function() {
          if (t.__outOfDate) {
            setImmediate(function() {
              t.info(">>> Code changed during make, restarting...")
              t.fireEvent("remaking");
              make();
            });
          } else {
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
            var endTime = new Date().getTime();
            t.info(">>> Compiled " + t.__stats.classesCompiled + " classes in " + formatTime(endTime - startTime)); 
            t.__making = false;
            t.fireEvent("made");
          }
        });
      }
      
      make();
    },
    
    __scheduleMake: function() {
      var t = this;
      if (!t.__making) {
        if (t.__timerId)
          clearTimeout(t.__timerId);
        t.__timerId = setTimeout(function() {
          t.__make();
        }, 500);
      }
    },
    
    __onFileChange: function(filename) {
      //this.debug("Change: " + filename);
      var t = this;
      var outOfDate = false;
      t.__applications.forEach(function(data) {
        if (data.dependsOn[filename]) {
          outOfDate = true;
        }
      });
      if (!outOfDate) {
        t.__maker.getAnalyser().getLibraries().forEach(function(lib) {
          var boot = path.join(lib.getRootDir(), lib.getBootPath());
          boot = path.resolve(boot);
          if (filename.startsWith(boot))
            outOfDate = true;
        });
      }
      if (outOfDate) {
        t.__outOfDate = true;
        t.__scheduleMake();
      }
    },
    
    __onStop: function() {
      this.__runningPromise.resolve();
    }
  }
});