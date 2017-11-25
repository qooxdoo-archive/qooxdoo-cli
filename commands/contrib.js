exports.command = "contrib <command> [options]";
exports.desc = "manages qooxdoo contrib libraries";
exports.builder = function (yargs) {
  return yargs
    .commandDir('contrib_commands')
    .option('T', {
        alias: 'token',
        describe: 'Use a GitHub access token'
    })
    .option('f', {
        alias: 'file',
        describe: 'Output result to a file'
    })       
    .option('v', {
        alias: 'verbose',
        describe: 'Verbose logging'
    })
    .option('q', {
        alias: 'quiet',
        describe: 'No output'
    })  
    .demandCommand()
    .showHelpOnFail()
}
exports.handler = function (argv) {}