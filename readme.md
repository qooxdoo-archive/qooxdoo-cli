# qooxdoo command line interface

This command line utility allows you create, manage and build qooxdoo applications.

## Develoment status
Alpha/Proof-of-concept. Everything can and will change.

## Installation (Testing only!)
- Clone or download the repository from GitHub.
- go into the project folder and `npm install`
- `npm install -g` doesn't work yet (something with babel-register and global installs). 
  You need to call the `qx` executable with `node path/to/qx <commands and options>`

The following is just for convenience and reproduceability during the testing phase:
- Create a `test` directory inside the `qx-cli` directory and `cd` to it.
- Download a fresh copy of the master version of qooxdoo framework to a 
  subdirectory named `qooxdoo` in the `test` directory:

## Example command line usage
In the `test` directory, do the following:
- `node ../qx create foo`: creates the foo application skeleton
- `cd foo`
- `node ../../qx compile`: compile the application, using the compile.json default
  configuration values
 
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
  

```


## Resources:
- https://nodejs.org/api/
- http://yargs.js.org/docs/ (used to parse command line arguments and as code architecture)
- https://www.npmjs.com/package/conf (configuration cache)
