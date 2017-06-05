exports.command = "contrib <command> [options]";
exports.desc = "manages qooxdoo contrib libraries";
exports.builder = function (yargs) {
  return yargs
    .commandDir('contrib_commands')
    .option('a', {
        alias: 'all',
        describe: 'disable filters (for example, also show incompatible versions)'
    })
   .option('r', {
        alias: 'release',
        describe: 'use a specific release tag instead of the tag of the latest compatible release'
    })
    .option('v', {
        alias: 'verbose',
        describe: 'verbose logging'
    })     
    .demandCommand()
    .showHelpOnFail()
}
exports.handler = function (argv) {}