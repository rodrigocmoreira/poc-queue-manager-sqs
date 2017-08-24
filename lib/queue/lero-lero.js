const ROOT_PATH = process.cwd();
const winston = require('winston');

const lerolero = [];

const leroleroPool = (() => {
  const receiveMsg = (callback) => {   
    const message = JSON.stringify(lerolero.shift());
    let result;
    if (message) {
      winston.info('Message Received');
      winston.info('Message processed and deleted: ', message);
      result = {
        status: 200
      };
    } else {
      winston.info('Not found any message');
      result = {
        status: 404,
        message: 'Not found any message'   
      };
    }
    return callback(null, result);
  };

  const sendMsg = (message, callback) => {
    lerolero.push(message);
    winston.info(`Message Enqueued: ${JSON.stringify(message)}`);
    return callback();
  };

  return {
    receiveMsg,
    sendMsg
  };
})();

module.exports = leroleroPool;
