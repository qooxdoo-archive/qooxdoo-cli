# qooxdoo command line interface

This command line utility allows you create, manage and build qooxdoo applications.

## Develoment status
Alpha/Proof-of-concept. Everything can and will change.

## Installation (Testing only!)
- Clone or download the repository from GitHub.
- npm global install doesn't work yet. You need to call the `qx` 
  executable with `node path/to/qx <commands and options>`

The following is just for convenience and reproduceability during the testing phase:
- Create a `test` directory inside the `qx-cli` directory and `cd` to it.
- Download a fresh copy of the master version of qooxdoo framework to a 
  subdirectory named `qooxdoo` in the `test` directory:

## Example command line usage
- `node ../qx create foo`: creates the foo application skeleton
- `cd foo`
- `node ../../qx compile`: compile the application, using the compile.json default
  configuration values
 
## TODO
- make it work :-) 
- create an npm installable package
- install qx as global executable

## Resources:
- https://nodejs.org/api/
- http://yargs.js.org/docs/ (used to parse command line arguments and as code architecture)
- https://www.npmjs.com/package/conf (configuration cache)
