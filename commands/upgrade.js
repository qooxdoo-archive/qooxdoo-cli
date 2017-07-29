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

/**
 * Script to initialise a new qooxdoo application, or upgrade an old (pre-6.0) application
 */

const qx = require("../lib/qxcli.js");

exports.command = "upgrade [options]";
exports.desc = "upgrades a qooxdoo application";
exports.usage = "upgrade";
exports.builder = function (yargs) {
  return yargs
    .option('v', {
        alias: 'verbose',
        describe: 'verbose logging'
    })
    .showHelpOnFail()
}
exports.handler = function (argv) {
  try {
    return new qxcli.commands.Upgrade(argv).process();
  } catch (e) {
    console.error(e);
  }

}