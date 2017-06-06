# qooxdoo command line interface

This command line utility allows you create, manage and build qooxdoo applications.

## Develoment status
Alpha/Proof-of-concept. Everything can and will change.

## Prerequisites
- Currently requires NodeJS v7 or 8. The released version will be transpiles to support earlier node versions

## Installation (Testing only!)
- Clone or download the repository from GitHub.
```
cd qx-cli
npm install
```
- In order to have a globally callable executable, do the following (Linux/Mac):
```
pushd /usr/local/bin
sudo ln -s path/to/qx-cli/qx
popd
```
- If you want to use an unreleased version of qxcompiler, download it and 
  `npm link path/to/qxcompiler` from the `qx-cli` directory.

Please use the following setup during the testing phase:
- Create a `test` directory inside the `qx-cli` directory and `cd` to it.
- Download a fresh copy of the master version of https://github.com/johnspackman/qooxdoo
  framework into the `test` directory and rename it to `qooxdoo`.

## Example command line usage
In the `test` directory, do the following:
```
qx create foo # creates the foo application skeleton
cd foo
qx compile # compile the application, using the compile.json default configuration values
qx conntrib install johnspackman/UploadMgr # instal UploadMgr contrib library 
```
 
## TODO
- make it work :-) 
- create an npm installable package
- install qx as global executable

## Documemtation
```
Typical usage:
  qx <commands> [options]

Type qx <command> --help for options and subcommands.

Commands:
  compile [options] [configFile]       compiles the current application, using
                                       compile.json
  contrib <command> [options]          manages qooxdoo contrib libraries
  create <application name> [options]  creates a qooxdoo application skeleton>


qx compile [options] [configFile]

Options:
  --all-targets             Compile all targets in config file         [boolean]
  --target                  Set the target type: source, build, hybrid or class
                            name                    [string] [default: "source"]
  --output-path             Base path for output                        [string]
  --locale                  Compile for a given locale                   [array]
  --write-all-translations  enables output of all translations, not just those
                            that are explicitly referenced             [boolean]
  --set                     sets an environment value                    [array]
  --app-class               sets the application class                  [string]
  --app-theme               sets the theme class for the current application
                                                                        [string]
  --app-name                sets the name of the current application    [string]
  --library                 adds a library                               [array]
  --continuous              enables continuous compilation             [boolean]
  --verbose                 enables additional progress output to console
                                                                       [boolean]

qx create <application name> [options]

Options:
  -t, --type       Type of the application to create, one of: ['desktop',
                   'inline', 'mobile', 'native', 'server', 'website'].'desktop'
                   -- is a standard qooxdoo GUI application; 'inline' -- is an
                   inline qooxdoo GUI application; 'mobile' -- is a qooxdoo
                   mobile application with full OO support and mobile GUI
                   classes; 'native' -- is a qooxdoo application with full OO
                   support but no GUI classes; 'server' -- for non-browser run
                   times like Rhino, node.js; 'website' -- can be used to build
                   low-level qooxdoo applications. (Default: desktop)
                                                            [default: "desktop"]
  -o, --out        Output directory for the application folder    [default: "."]
  -s, --namespace  Applications's top-level namespace.
  -q, --qxpath     Path to the folder containing the qooxdoo framework.
                                                          [default: "./qooxdoo"]
  -v, --verbose    verbose logging
  
qx contrib <command> [options]

Commands:
  install  installs the latest compatible release of a contrib library (as per
           Manifest.json). Use "-r <release tag>" to install this particular
           release.
  list     if no repository name is given, lists all available contribs that are
           compatible with the project's qooxdoo version ("--all" lists
           incompatible ones as well). Otherwise, list all releases of this
           contrib library.
  remove   removes a contrib library from the configuration.
  update   updates information on contrib libraries from github. Has to be called
           before the other commands. 

Options:
  -a, --all      disable filters (for example, also show incompatible versions)
  -r, --release  use a specific release tag instead of the tag of the latest
                 compatible release
  -v, --verbose  verbose logging

```


## Resources:
- https://nodejs.org/api/
- http://yargs.js.org/docs/ (used to parse command line arguments and as code architecture)
- https://www.npmjs.com/package/conf (configuration cache)
