# Qooxdoo CLI Release  Notes

## 0.1.30 (Beta Release)
### `qx compile` release notes
* fixes qooxdoo-compiler#30 qx resources doesn't seem to be copied over
* fixes qooxdoo-compiler#31 new resources not copied over after --watch has started
* warnings and errors output above gas gauge

## 0.1.29 (Beta Release)
### `qx compile` release notes
* Upgrade to latest Qooxdoo-Compiler
* Add gas-gauge feedback
* TypeScript generation is no longer implemented as a separate "target", instead it can be switched on for whatever the current target is.  This impacts the `compile.json` - see [qx-cli/docs/compile-json.md](https://github.com/qooxdoo/qooxdoo-cli/blob/master/docs/compile-json.md#typescript) 
* Added `--no-erase` to prevent output from being deleted even if package version changes
* Added `--no-feedback` to prevent gas-gauge style feedback
* Added `minification` setting to targets, application, and command line

