const { HTTP_STATUS_INTERNAL_SERVER_ERROR } = require('../utils/constants');

module.exports.handleErrors = (err, req, res, next) => {
  const { statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === HTTP_STATUS_INTERNAL_SERVER_ERROR ? 'Произошла ошибка  на сервере' : message,
    });

  next();
};
