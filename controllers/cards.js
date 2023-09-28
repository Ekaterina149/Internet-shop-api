const httpConstants = require('http2').constants;
const ForbiddenError = require('../errors/forbiddenError');
const NotFoundError = require('../errors/notFoundError');
const BadRequestError = require('../errors/badRequestError');
const Card = require('../models/card');

const { HTTP_STATUS_CREATED, HTTP_STATUS_OK } = httpConstants;
module.exports.getCards = (req, res, next) => {
  Card.find({})
    .sort({ createdAt: -1 })
    .then((cards) => res.status(HTTP_STATUS_OK).send(cards))
    .catch((err) => next(err));
};
module.exports.createCard = (req, res, next) => {
  const {
    productName,
    description,
    articleNumber,
    pictureBig,
    pictureSmall,
    price,
    size,
    material,
    amount,
  } = req.body;
  Card.create({
    productName,
    description,
    articleNumber,
    pictureBig,
    pictureSmall,
    price,
    size,
    material,
    amount,
  })
    .then((card) => res.status(HTTP_STATUS_CREATED).send(card))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        const errArray = Object.values(err.errors);
        const messages = errArray
          .map((element, index) => `№${index + 1}. ${element.message}`)
          .join(', ');
        return next(
          new BadRequestError(
            messages.length
              ? messages
              : 'Переданы некорректные данные при создании товара',
          ),
        );
      }
      return next(err);
    });
};
module.exports.deleteCard = (req, res, next) => {
  Card.findOne({ _id: req.params.id })
    .orFail()
    .then((card) => card.deleteOne())
    .then((card) => res.status(HTTP_STATUS_OK).send(card))
    .catch((err) => {
      if (err.name === 'DocumentNotFoundError') {
        return next(new NotFoundError('Товар с указанным _id не найден.'));
      }
      if (err.name === 'CastError') {
        return next(
          new BadRequestError(
            'Переданы некорректные данные при удалении товара.',
          ),
        );
      }

      return next(err);
    });
};
