const Conf = require('conf');
exports.command   = 'set <key> <value>';
exports.describe  = 'set a config variable.';
//exports.builder   = (yargs) => yargs.default('value', 'true');
exports.handler = function (argv) {
  const config = new Conf;
  const allowedKeys = ["github.token"];
  if( ! allowedKeys.includes(argv.key) ){
    console.error("Valid keys are: " + allowedKeys.join(", "));
    return 1;
  }
  console.log(`Setting ${argv.key} to ${argv.value}`);
  config.set(argv.key, argv.value);
};
