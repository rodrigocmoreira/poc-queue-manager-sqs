const ROOT_PATH = process.cwd();
const async = require('async');
const winston = require('winston');
const queueManager = require(`${ROOT_PATH}/lib/queueManager`);
const sqs = require(`${ROOT_PATH}/lib/queue/sqs`);
const lerolero = require(`${ROOT_PATH}/lib/queue/lero-lero`);

async.waterfall([
  (callback) => {
    winston.info('Start SQS queue process');
    queueManager.processQueue(sqs, (err) => {
      winston.info('Finished SQS queue process');
      callback(err);
    })
  },
  (callback) => {
    winston.info('Start Lero Lero queue process');
    queueManager.processQueue(lerolero, (err) => {
      winston.info('Finished Lero Lero queue process');
      callback(err);
    })
  }
], (err) => {
  if (err) {
    winston.error(err);
  }
});
