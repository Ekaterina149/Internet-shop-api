const { HTTP_STATUS_NOT_FOUND } = require('../utils/constants');

class ZeroAmountError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = HTTP_STATUS_NOT_FOUND;
  }
}

module.exports = ZeroAmountError;
