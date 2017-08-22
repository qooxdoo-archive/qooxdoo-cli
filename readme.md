# qooxdoo command line interface

This command line utility allows you create, manage and build qooxdoo applications.

## Develoment status
Alpha/Proof-of-concept. Everything can and will change.

## Prerequisites
- **Node** Currently requires NodeJS v8. The released version will be transpiled to support earlier node versions, but whichever
version you choose to use we recommend you consider `nvm` to ease installing and switching between node versions - you
can find the Linux version at http://nvm.sh and there is a version for Windows at 
https://github.com/coreybutler/nvm-windows

Install `nvm` and then:

```bash
nvm install 8
nvm use 8
```

- **Qooxdoo** - you need a clone of the Qooxdoo repository - automatic installation is coming (and will be part of the
6.0 release) but for now you need to make sure you clone the repo yourself:

```bash
git clone https://github.com/qooxdoo/qooxdoo.git
```
  
- **Python v2** - you still need Python v2, again this will go soon but for now please install a recent version 2 (not v3) of
    python from https://www.python.org/downloads/.  
    
    **NOTE** If you're on Windows, make sure you add Python to your PATH
     
(Note that there is no longer a dependency on ImageMagick)


## Installation
- Install qx-cli, create a sample application and compile it
```bash
npm install -g qx-cli
qx create myapp
cd myapp
qx compile
```

Note that `qx-cli` needs to be able to find the `qooxdoo` repo that you cloned from github - in the example above,
it finds it because it discovers a `qooxdoo` directory, but if you place your `qooxdoo` directory elsewhere you
should use this syntax to create an application:
```
qx create myapp --qxpath /path/to/qooxdoo/repo
```

## Installation for Development
- Install qx-cli 
```bash
git clone https://github.com/qooxdoo/qx-cli
cd qx-cli
npm install
```

- In order to have a globally callable executable, do the following:
```bash
npm link
```

- If you want to use an unreleased version of qxcompiler, download it and 
  `npm link path/to/qxcompiler` from the `qx-cli` directory.


## Example command line usage
```bash
qx create myapp # creates the foo application skeleton
cd myapp

# (optional) install contrib libraries
qx contrib update # updates the local cache with information on available contribs 
qx contrib list # lists contribs compatible with myapp's qooxdoo version, determine installation candidate
qx contrib install johnspackman/UploadMgr # install UploadMgr contrib library 

# compile the application, using the compile.json default configuration values 
qx compile
```
 
## TODO
- [x] make it work, i.e., compile :-) 
- [ ] create an npm installable package
- [x] install qx as global executable

## Documemtation

### Commands

```
Typical usage:
  qx <commands> [options]

Type qx <command> --help for options and subcommands.

Commands:
  compile [options] [configFile]       compiles the current application, using
                                       compile.json
  contrib <command> [options]          manages qooxdoo contrib libraries
  create <application name> [options]  creates a qooxdoo application skeleton
  upgrade [options]                    upgrades a qooxdoo application


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
  --watch                   enables continuous compilation             [boolean]
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

qx upgrade [options]

Options:
  -v, --verbose  verbose logging
```

### How to list get your contrib repository listed with `qx contrib list`

- The repository **must** have a [GitHub topic](https://help.github.com/articles/about-topics/)
  `qooxdoo-contrib` in order to be found and listed.
- The tool will only show **[releases](https://help.github.com/articles/about-releases/)**
  not branches. The releases (tags) **should** be named in
  [semver-compatible format](http://semver.org/) (X.Y.Z). They **can** start with a "v"
  (for "version").
- In order to be installable, the library manifests must be placed in the repository in one of the
  following ways:
  
  a) If the repository contains just **one single library**, its `Manifest.json` file **should** be placed
     in the repository's root directory.
  b) If you ship **several libraries** in one repository, or you want to place the `Manifest.json` file
     outside of the root directory, you **must** provide a `qooxdoo.json` file in the root dir. This
     file has the following syntax:
     
 ```
 {
   "contribs": [
    { "path":"./path/to/dir-containing-manifest1" },
    { "path":"./path/to/dir-containing-manifest2" },
    ...
  ]
}
```

- Make sure to keep the "qooxdoo-version" key up to date. You **should** use a [semver range](https://github.com/npm/node-semver#ranges)   
  string instead of the legacy array (`["4.1","5.0"]`) and adapt your validation tool chain if 
  necessary. The old array format will be supported for at least the 6.0 version. It is internally
  converted to a semver range.


### compile.json
Documentation for the compile.json format is [docs/compile-json.md](docs/compile-json.md)

