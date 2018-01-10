# qooxdoo command line interface

[![Build Status](https://travis-ci.org/qooxdoo/qooxdoo-cli.svg?branch=master)](https://travis-ci.org/qooxdoo/qooxdoo-cli)

This command line utility allows you create, build and manage [qooxdoo](http://www.qooxdoo.org) applications.

<!-- TOC -->

- [qooxdoo command line interface](#qooxdoo-command-line-interface)
    - [Develoment status](#develoment-status)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Installation for Development](#installation-for-development)
    - [Example command line usage](#example-command-line-usage)
    - [Documemtation](#documemtation)
        - [Commands](#commands)
        - [Compiler](#compiler)
        - [Create a new project](#create-a-new-project)
        - [qooxdoo-contrib system](#qooxdoo-contrib-system)
        - [Manifest.json](#manifest.json)

<!-- /TOC -->

## Develoment status
Beta. The API is still likely to change, but not fundamentally.

## Prerequisites
- **Node** Currently requires NodeJS v8. The released version will be 
  transpiled to support earlier node versions, but whichever version you 
  choose to use we recommend you consider `nvm` to ease installing and 
  switching between node versions - you can find the Linux version at 
  http://nvm.sh and there is a version for Windows at 
  https://github.com/coreybutler/nvm-windows 

Install `nvm` and then:

```bash
nvm install 8
nvm use 8
```

## Installation
- Install qx-cli, create a sample application and compile it
```bash
npm install -g qx-cli
qx create myapp
cd myapp
qx compile
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

- If you want to use an unreleased version of qxcompiler, download it with `git clone https://github.com/qooxdoo/qooxdoo-compiler` and 
  `npm link path/to/qxcompiler` from the `qx-cli` directory.

- If you want to use an unreleased version of qooxdoo, download it with `git clone https://github.com/qooxdoo/qooxdoo` and 
  `npm link path/to/qooxdoo` from the `qx-cli` directory.

- Pay attention: the linking must be repeated after an `npm install`. `npm install` substitutes the links with the NPM modules.

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

Use `--all` if you don't get any contribs listed or if the ones you are 
looking for are missing. The reason is that they might not declare 
compatibility to the qooxdoo version you are using yet, even though they are 
technically compatible. 

## Documemtation

### Commands

```
Typical usage:
  qx <commands> [options]

Type qx <command> --help for options and subcommands.

Commands:
  compile [configFile]                      compiles the current application,
                                            using compile.json
  contrib <command> [options]               manages qooxdoo contrib libraries
  create <application namespace> [options]  creates a new qooxdoo project.
  upgrade [options]                         upgrades a qooxdoo application

````

To see the subcommands parameters and options, just type in `qx <command>`.

### Compiler

To compile a qooxdoo project into a state that can be opened in a browser, use 
`qx compile`. This is the CLI frontend for the [qooxdoo-compiler library](https://github.com/qooxdoo/qooxdoo-compiler/blob/master/README.md). 
The command has the following options: 

```
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
The compiler relies on the information contained in `compile.json`. Documentation for the `compile.json` format is [here](docs/compile-json.md).

### Create a new project

You can create new project skeletons by using the `qx create` command` It has the following options:
```
  --type, -t            Type of the application to create.              [string]
  --out, -o             Output directory for the application content.
  --namespace, -s       Top-level namespace.
  --name, -n            Name of application/library (defaults to namespace).
  --qxpath              Path to the folder containing the qooxdoo framework.
  --theme               The name of the theme to be used.    [default: "indigo"]
  --icontheme           The name of the icon theme to be used.
                                                             [default: "Oxygen"]
  --noninteractive, -I  Do not prompt for missing values
  --verbose, -v         Verbose logging
```

The fastest way to create a new project is to execute `qx create foo -I`. This will create a new application with the namespace "foo", using default values. However, in most cases you wamt to customize the generated application skeleton. `qx create foo` will interactively ask you all information it needs, providing default values where possible. If you are in the top-level folder of the application and want to put the application content into it without creating a subfolder (for example, in a top-level folder of a cloned empty GitHub project), use `--out=.`. 

### qooxdoo-contrib system

qooxdoo's "plugin architecture" is called "qooxdoo-contrib"  (short for "contributions"). It does not only allow to extend one's own application with useful functionality such as file uploads, dialog widgets, vector graphics and much more, qooxdoo-contrib will also host components that have previously shipped with the framework, such as the API viewer or the playground. The CLI supports the use, creation and mainenance of contributions with the `qx contrib` subcommands. 

```
qx contrib <command> [options]

Commands:
  install [repository]  installs the latest compatible release of a contrib
                        library (as per Manifest.json). Use "-r <release tag>"
                        to install a particular release.
  list [repository]     if no repository name is given, lists all available
                        contribs that are compatible with the project's qooxdoo
                        version ("--all" lists incompatible ones as well).
                        Otherwise, list all compatible contrib libraries.
  publish               publishes a new release of the contrib on GitHub.
                        Requires a GitHub access token. By default, makes a
                        patch release.
  remove [repository]   removes a contrib library from the configuration.
  update [repository]   updates information on contrib libraries from github.
                        Has to be called before the other commands.

```

Please see the detailed documentation [here](docs/contrib.md).


### Manifest.json

To provide additional information and configuration for qooxdoo libraries the file `Manifest.json` can be used - just like with the old python tool chain. A small difference is the added option to add static javascript and stylesheet files which will automatically be loaded into the application. Please refer to the [detailed documentation](docs/Manifest.md) for further information. Here is a shortened example of how to add static files:

```json
{
  // "info" : { ... },
  // "provides" : { ... },

  "externalResources" :
  {
    "script": [
      "js/customscript.js",
    ],
    "css": [
      "styles/style.css"
    ]
  }
}
```
