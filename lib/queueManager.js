const ROOT_PATH = process.cwd();
const async = require('async');
const winston = require('winston');
const config = require(`${ROOT_PATH}/lib/config`);
const queueLenght = config.get('QUEUE_LENGHT');

const queueManager = (() => {

  const checkQueue = (queue) => ((queue.receiveMsg && typeof queue.receiveMsg === 'function') &&
      (queue.sendMsg && typeof queue.sendMsg === 'function'))

  const processQueue = (queue, callback) => {
    let enqueued = 0;
    let dequeued = 0;
    let retryCount = 0;

    if (!checkQueue(queue)) {
      const error = {
        message: 'Invalid Queue Object!'
      };
      return callback(error);
    }

    async.parallel([
      (next) => {
        async.whilst(() => enqueued < queueLenght, (callbackEnqueued) => {
          queue.sendMsg(enqueued, (errSend) => {
            if (!errSend) {
              enqueued++;
              winston.info('Enqueued: ', enqueued);
            }
            callbackEnqueued(errSend, enqueued);
          });
        },
        (errEnqueued) => {
          if (errEnqueued) {
            winston.error('Error on async while for enqueue:', errEnqueued);
          }
          return next(errEnqueued);
        })
      },
      (next) => {      
        async.whilst(() => dequeued < queueLenght, (callbackDequeued) => {
          queue.receiveMsg((errReceive, result) => {
            if (!errReceive && (result.status && result.status === 200)) {
              dequeued++;
              winston.info('Dequeued: ', dequeued);
              retryCount = 0;
            } else {
              retryCount++;
              winston.info('Retry Count: ', retryCount);

              if(retryCount > queueLenght) {
                return callbackDequeued(errReceive);
              }
            }

            return callbackDequeued(errReceive, dequeued);
          });
          },
          (errDequeued) => {
            if (errDequeued) {
              winston.error('Error on async while for dequeue:', errDequeued);
            }
            return next(errDequeued);
          }
        );
      }], (err) => {
        if (err) {
          winston.error('Error on async:', err);
        }
        return callback();
      }
    );
  };

  return {
    processQueue
  };
})();

module.exports = queueManager;
