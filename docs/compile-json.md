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
    "defaultTarget": "source"
}
```

That's a basic (but completely functional) compile.json; optional settings are below.

## Applications
The `applications` key is an array of objects, and each object can contain:
- `class` - this is the class name of your main application (it typically inherits from `qx.application.Standalone` for web applications)
- `theme` - this is the theme class for your application
- `name` - this is an arbitrary, but unique, short name for your application and should be filename and URL friendly - IE no spaces or special characters
- `environment` - (**optional**) this is a set of application-specific environment settings that override all other settings when compiling this application (see below)
- `outputPath` - (**optional**) the directory to place the application files (e.g. boot.js and resource.js), relative to the target output directory
- `uri` - (**optional**) this sets the URI used to access the application directory, i.e. the directory containing boot.js and resource.js; the default is to assume that it is "."
- `include` - (**optional**) this is an array of class names which are to be included in the compilation, regardless of whether the compiler can detect if they are needed (for example, your application dynamically choose class names on the fly).  Wildcards are supported by adding a `*`, for example `"include": [ "qx.util.format.*" ]`
- `exclude` - (**optional**) this is an array of class names which are to be excluded from the application, regardless of whether the compiler thinks that they are needed.  Wildcards are supported by adding a `*`, for example `"exclude": [ "qx.util.format.NumberFormat" ]`.  Note that `exclude` takes priority over `include`
- `compiler` - (**optional**, **advanced**) this is the class name in `qooxdoo-compiler` to use when compiling the application

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


## TypeScript
TypeScript can be output by adding a new target to your compile.json, for example:
```
    /** Targets */
    "targets": [
        {
            "type": "typescript",
            "outputPath": "source-output",
            "include": [ "*" ],
            "exclude": [ "qx.test.*" ]
        }
        /* ... snip ... */
    ]
```
The target will do a full "Source" compile, and you would use the `include` and `exclude` to indicate the classes you're interested in.  The TypeScript definition is output into `./source-output/qooxdoo.d.ts`




