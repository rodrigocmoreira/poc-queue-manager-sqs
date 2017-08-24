const ROOT_PATH = process.cwd();
const nconf = require('nconf');

nconf.argv()
  .env()
  .file(`${ROOT_PATH}/conf/queue.json`)
  .defaults({
  });

module.exports = nconf;
