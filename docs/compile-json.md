# compile.json

Compile.json controls the `qx compile` command, and while you can use command line parameters to compile an application, most applications will require one.

The key concepts of a compilation are that:
- source code exists in **Libraries** (the Qooxdoo framework is a Library, as is any contribs you use, and also *your own application source code is a Library*)
- source code is compiled into one or more **Applications** (ie something that the end-user interacts with using their web browser)
- when an Application is compiled, it is compiled to **Target** a particular usage, EG the "source" Target is for debugging the source code, and the "build" Target is for production use and is optimised and minified

These key concepts appear in every compile.json, for example:
```
{
    /** Applications */
    "applications": [
        {
            "class": "demoapp.Application",
            "theme": "demoapp.theme.Theme",
            "name": "demoapp"
        }
    ],
    
    /** Libraries */
    "libraries": [
        "../qooxdoo/framework",
        "."
    ],
    
    /** Targets */
    "targets": [
        {
            "type": "source",
            "outputPath": "source-output"
        },
        {
            "type": "build",
            "outputPath": "build-output"
        }
    ],
    "defaultTarget": "source",
    
    /** Path Mappings */
    "path-mappings": {
        "../qooxdoo": "/some/folder/qooxdoo"
    }
}
```

That's a basic (but completely functional) compile.json; optional settings are below.

## Applications
The `applications` key is an array of objects, and each object can contain:
- `class` - this is the class name of your main application (it typically inherits from `qx.application.Standalone` for web applications)
- `theme` - this is the theme class for your application
- `name` - this is an arbitrary, but unique, short name for your application and should be filename and URL friendly - IE no spaces or special characters
- `title` - (**optional**) this is the human readable, customer facing description used to set the `<title>` tag of the application web page, i.e. in the application's index.html 
- `environment` - (**optional**) this is a set of application-specific environment settings that override all other settings when compiling this application (see below)
- `outputPath` - (**optional**) the directory to place the application files (e.g. boot.js and resource.js), relative to the target output directory
- `uri` - (**optional**) this sets the URI used to access the application directory, i.e. the directory containing boot.js and resource.js; the default is to assume that it is "."
- `include` - (**optional**) this is an array of class names which are to be included in the compilation, regardless of whether the compiler can detect if they are needed (for example, your application dynamically choose class names on the fly).  Wildcards are supported by adding a `*`, for example `"include": [ "qx.util.format.*" ]`
- `exclude` - (**optional**) this is an array of class names which are to be excluded from the application, regardless of whether the compiler thinks that they are needed.  Wildcards are supported by adding a `*`, for example `"exclude": [ "qx.util.format.NumberFormat" ]`.  Note that `exclude` takes priority over `include`
- `type` - (**optional**, **advanced**) this is "browser" (the default) for the typical, web browser based, application or "node" for a node.js server
application.
`loaderTemplate` - (**optional**, **advanced**) this is the boot loader template file, usually determined automatically from the application `type` 
`minify` - (**optional**) determines the minification to be used for this application, if the target supports it; overrides other settings.  Can be `off`, `minify`, `mangle` or `beautify`; takes precedence over the target's `minify` setting.

A complete example is:
```
{
    /** Applications */
    "applications": [
        {
            "class": "demoapp.Application",
            "theme": "demoapp.theme.Theme",
            "name": "demoapp",
            "environment": {
                "qx.icontheme": "Oxygen"
            },
            "include": [ "qx.util.format.*", "qx.utils.Base64" ],
            "exclude": [ "qx.util.format.NumberFormat" ]
        }
    ],
```

## Targets
The `targets` key is an array of objects, one for each possible target that can be compiled.  Each object can contain:
- `type` - this is either "source", "build", "hybrid" or a class name in `qooxdoo-compiler`; using a class name is advanced usage, but ultimately the standard names just shortcuts to class names anyway ("source" is `qxcompiler.targets.SourceTarget`, etc)
- `outputPath` the folder where the compilation outputs to, and will be created if it does not already exist
- `uri` - (**optional**) this sets the URI used to access the target output directory, i.e. the directory which will contain `resources/` and `transpiled/`.  
- `environment` (**optional**) additional environment settings that override any in the top level `environment` object (if there is one); these can be overridden by the Application's own `environment` block
- `writeCompileInfo` (**optional**) if true, the target will write a `compile-info.json` and `resources.json` into the application's output directory, containing the data structures required to generate an application
- `uri` (**optional**) the URI used to load resources for this target; by default, this is assumed to be relative to the application's index.html
- `typescript` - see below
- `minify` - (**optional**) determines the minification to be used for applications, if the target supports it; can be overridden on a per application basis.  Can be `off`, `minify`, `mangle`, or `beautify`.
- `addCreatedAt` - (**optional**) if true, this will cause every object to have a hidden property called `$$createdAt` which points to an object containing `filename`, `lineNumber`, and `column` properties

## Parts
Parts are supported by adding a `parts` object, either at the top level, inside a target object, or inside an application object.  It looks like this:
```
    "parts": {
        "boot": {
            "include": [ "demoapp.Application", "demoapp.theme.Theme" ],
            "exclude": []
        },
        "plugin-framework": {
            "include": [ "demoapp.plugins.pdk.*" ]
        }
    },
```
Each part has an `include` array which is a list of classes (including wildcards) that are to be included; this does not add to the list of classes which are loaded by the application (see `applications[].include` for that), it is used to select the classes which are included into a part.  The `exclude` array is an optional list of class specification to exclude from the part.

The `boot` part is a special name and must be provided (unless you're not specifying any parts at all).  It needs to list the classes which are required for the main application to be loaded - typically this will be your main application class and the theme.  

Unlike the generator, it is permissible to overlap class definitions when using wildcards - however, a class can still only be loaded into a single part, so the compiler will prioritise more specific package names and emit a warning if there is a conflict.

## Environment Settings
Settings can be passed into an application via `qx.core.Environment` by adding an `environment` key, for example:

```
{
    /* ... snip ... */
    "defaultTarget": "source",
    "environment": {
        "qx.icontheme": "Oxygen"
        "demoapp.myCustomSetting": 42
    }
}
```

If you add the `environment` block at the top level of the compile.json (as in the example above), they will effect every application regardless of the target.  You can also add `environment` to the Target and/or to the Application, they will be merged so that the Application's environment takes prescedence over Target's environment, which in turn takes prescedence over the top level.  For example:

```
{
    "applications": [
        {
            "class": "demoapp.FirstApplication",
            "theme": "demoapp.theme.Theme",
            "name": "appone",
            "environment": {
                "demoapp.myCustomSetting": 3
            }
        },
        {
            "class": "demoapp.SecondApplication",
            "theme": "demoapp.theme.Theme",
            "name": "apptwo"
        }
    ],
    "targets": [
        {
            "type": "source",
            "outputPath": "source-output",
            "environment": {
                "demoapp.myCustomSetting": 2
            }
        },
        {
            "type": "build",
            "outputPath": "build-output"
        }
    ],
    "environment": {
        "qx.icontheme": "Oxygen"
        "demoapp.myCustomSetting": 1
    }
}
```
In this example, `demoapp.myCustomSetting` is always 3 for the `appone` Application, and either 1 or 2 for `apptwo` depending on whether you're compile a `source` Target or a `build` Target.


## Locales
Qooxdoo applications are by default compiled only using the "en" locale for transation strings, but you can change this by adding the `locales` key as an array, for example:

```
{
    /* ... snip ... */
    "defaultTarget": "source",
    "locales": [
        "en",
        "es"
    ]
}
```

By default, only translation strings which are used by the classes are included - if you want to copy *all* translation strings you can include `writeAllTranslations: true` at the top level.


## Path Mappings
In many circumstances, you do not need to worry about path mappings because the compiler will copy (or transpile) source code and resources from all libraries into the one output directory.  In production, your application will never need to load files outside of the output directory, but during development your browser will need to have access to the original, untranspiled source files in order to be able to debug your original code.

The `"path-mappings"` configuration is a generic means to locate files on disk inside the URI addsress space of the application; for example, if a library like Qooxdoo is stored outside of your web root you might choose to add a mapping like this:

```
    "path-mappings": {
        "../qooxdoo": "/some/virtual/uri/path/qooxdoo"
    }
```

This tells the compiler that when any file in the directory "../qooxdoo" is needed, it should be loaded via the URI "/some/virtual/uri/path/qooxdoo".  Note that the "../qooxdoo" in this example refers to a path on disk (and is relative to the location of `compile.json`), whereas the "/some/virtual/uri/path/qooxdoo" is the URI.

It is up to you to implement the mapping inside your web server so that the "/some/virtual/uri/path/qooxdoo" URI is able to load the files from `../qooxdoo`

## TypeScript
** Note that this has changed: you no longer add a new target **
TypeScript can be output by either using the `--typescript` option to `qx compile`, or by modifying your target(s) to add `typescript: true`; if you use a string instead of `true`, the string is the name of the file which is generated inside the target output directory, for example:
```
    /** Targets */
    "targets": [
        {
            "type": "source",
            "outputPath": "source-output",
            typescript: true
        }
        /* ... snip ... */
    ]
```
The TypeScript definition is output into `./source-output/qooxdoo.d.ts`

## compile.js
Configuration files do not support processes, job executions, or even macros - if you want to add basic processing (eg for macros), use a .js file to manipulate the data. 
.js MUST return a function. This function MUST accept two arguments, one for the data (which will be null if there is no .json) and the second is the callback to call when complete; the callback takes an error object and the output configuration data.

If you provide a .js file and there is also a .json, then it is loaded and parsed first. The function in the .js is called with the parsed data from the .json file as a parameter.

Example:

```
function compile(data, callback) {
	console.log('I'm here');	
    let err = null;
	callback(err, data);
}
```

If err is not null loading of the config file is rejected.

### How to add sass call for mobile projects:

```
async function compile(data, callback) {
  /**
 * Adds sass support for current project.
 * Needed for qx.mobile projects.
 * 
 * PreReqs:
 *    - add dependency to project package.json: "runscript": "^1.3.0"
 *    - run npm install in project dir.
 *  
 * @param {*} data       : config data from compile.json
 * @param {*} callback   : callback for qxcli.  
 */
  debugger;
  const runscript = require('runscript');
  const util = require('util');
  runScript = async function (cmd) {
    return new Promise((resolve) => runscript(cmd, {
        stdio: 'pipe'
      })
      .then(stdio => {
        console.log('Run "%s"', cmd);
        if (stdio.stdout)
          console.log(stdio.stdout.toString());
        if (stdio.stderr)
          console.log(stdio.stderr.toString());
        resolve();
      })
      .catch(err => {
        console.error(err.toString());
        if (err.stdio.stdout)
          console.error(err.stdio.stdout.toString());
        if (err.stdio.stderr)
          console.error(err.stdio.stderr.toString());
        resolve();
      }));
  }
  let cmd = 'sass -C -t compressed -I %1/source/resource/qx/mobile/scss -I %1/source/resource/qx/scss --%3 source/theme/%2/scss:source/resource/%2/css';
  cmd = qx.lang.String.format(cmd, [data.libraries[0], data.applications[0].name]);
  if (!this.argv.watch) {
     cmd = qx.lang.String.format(cmd, ["", "", "update"]);
     await runScript(cmd);
  } else {
    cmd = qx.lang.String.format(cmd, ["", "", "watch"]);
    runScript(cmd);
  }       
  callback(null, data);
}```




     




