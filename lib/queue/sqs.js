const ROOT_PATH = process.cwd();
const aws = require('aws-sdk');
const winston = require('winston');
const config = require(`${ROOT_PATH}/lib/config`);
const queueName = config.get('SQS_QUEUE_FIFO_NAME');
const queueGroupId = config.get('SQS_QUEUE_GROUP_ID');
const queueUrl = config.get('SQS_QUEUE_FIFO_URL');
const queueMsgTimeOut = config.get('SQS_QUEUE_TIMEOUT');

let sqs;

if (!sqs) {
  aws.config.loadFromPath(`${ROOT_PATH}/aws-config.json`);
  sqs = new aws.SQS();
}

const sqsPool = (() => {
  const receiveMsg = (callback) => {
    const params = {
      QueueUrl: queueUrl,
      VisibilityTimeout: queueMsgTimeOut,
      MaxNumberOfMessages: 1,
      MessageAttributeNames: [
        'All'
      ],
      WaitTimeSeconds: 10
    };
    
    sqs.receiveMessage(params, (err, data) => {
      if (err) {
        winston.error(err);
        return callback(err); 
      }
      if (data.Messages && data.Messages[0]) {
        winston.info('Message Received');
        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        sqs.deleteMessage(deleteParams, (errDelete, data) => {
          if (errDelete) {
            winston.error('Delete Error: ', errDelete);
            return callback(errDelete);
          } else {
            winston.info('Message processed and deleted: ', data);
            const result = {
              status: 200
            };
            return callback(errDelete, result);
          }
        });
      } else {
        winston.info('Not found any message');
        const result = {
          status: 404,
          message: 'Not found any message'   
        };
        return callback(null, result);
      }
    });
  };

  const sendMsg = (message, callback) => {
    const params = {
      MessageBody: `${message}`,
      QueueUrl: queueUrl,
      MessageGroupId: queueGroupId,
      DelaySeconds: 0
    };

    sqs.sendMessage(params, (err, data) => {
      if(err) {
        winston.error(err);
      } 
      else {
        winston.info(`Message Enqueued: ${JSON.stringify(data)}`);
      }
      return callback(err);
    });
  };

  return {
    receiveMsg,
    sendMsg
  };
})();

module.exports = sqsPool;
