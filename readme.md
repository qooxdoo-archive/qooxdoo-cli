# qooxdoo command line interface
[![Build Status](https://travis-ci.org/qooxdoo/qooxdoo-cli.svg?branch=master)](https://travis-ci.org/qooxdoo/qooxdoo-cli)
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
qx create myapp -I # creates the foo application skeleton non-interactively
cd myapp

# (optional) install contrib libraries
qx contrib update # updates the local cache with information on available contribs 
qx contrib list # lists contribs compatible with myapp's qooxdoo version, determine installation candidate
qx contrib install johnspackman/UploadMgr # install UploadMgr contrib library 

# compile the application, using the compile.json default configuration values 
qx compile
```

See [here](dpcs/contrib.md) if you don't get any contribs listed or if the ones you are looking for 
are missing.

## TODO
- [x] make it work, i.e., compile :-) 
- [ ] create an npm installable package
- [x] install qx as global executable
----
- [ ] qx contrib install without arguemnts installs all contribs listed in `contrib.json`
- [ ] Allow use of relative paths to the qooxdoo library for `qx create`

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
```

## Create a new project

You can create new project skeletons by using the `qx create` command` It has the following options:
```
  -t, --type            Type of the application to create [default: "desktop"]
  -o, --out             Output directory for the application content.
  -s, --namespace       Top-level namespace.
  -n, --name            Name of application/library (defaults to namespace).
  -q, --qxpath          Path to the folder containing the qooxdoo framework.
  --theme               The name of the theme to be used.    [default: "indigo"]
  --icontheme           The name of the icon theme to be used.
                                                             [default: "Oxygen"]
  -I, --noninteractive  Do not prompt for missing values
  -V, --verbose         Verbose logging
```

The fastest way to create a new project is to execute `qx create foo -I`. This will create a new application with the namespace "foo", using default values. However, in most cases you wamt to customize the generated application skeleton. `qx create foo` will interactively ask you all information it needs, providing default values where possible. If you are in the top-level folder of the application and want to put the application content into it without creating a subfolder (for example, in a top-level folder of a cloned empty GitHub project), use `--out=.`. 

### qooxdoo-contrib system

For more on qooxdoo's "plugin architecture" and the `qx contrib` commands, see [here](docs/contrib.md).

### compile.json
Documentation for the compile.json format is [docs/compile-json.md](docs/compile-json.md).

