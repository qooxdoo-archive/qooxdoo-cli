const Conf = require('conf');
exports.command   = 'unset <key>';
exports.describe  = 'removes a config variable.';
//exports.builder   = (yargs) => yargs.default('value', 'true');
exports.handler = function (argv) {
  const config = new Conf;
  const allowedKeys = ["github.token"];
  if( ! allowedKeys.includes(argv.key) ){
    console.error("Valid keys are: " + allowedKeys.join(", "));
    return 1;
  }
  console.log(`Removing ${argv.key}`);
  config.delete(argv.key);
};
