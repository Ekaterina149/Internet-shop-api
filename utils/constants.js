const { constants } = require('os');
const httpConstants = require('http2').constants;
const Card = require('../models/card');

const {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_CONFLICT,
} = httpConstants;
const linkPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const findAndReduceCardAmount = (field) => Card.find({ _id: { $in: field } })
  .then((cards) => {
    const cardsNoZeroAmount = cards.filter((card) => card.amount > 0);
    const cardsZeroAmount = cards.filter((card) => card.amount === 0);
    const newCards = cardsNoZeroAmount.map((card) => {
      card.amount -= 1;
      return card.save();
    });
    return Promise.all(newCards).then((savedCards) => [savedCards, cardsZeroAmount]);
  });
module.exports = {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_CONFLICT,
  linkPattern,
  findAndReduceCardAmount: (field) => Card.find({ _id: { $in: field } })
    .then((cards) => {
      const cardsNoZeroAmount = cards.filter((card) => card.amount > 0);
      const cardsZeroAmount = cards.filter((card) => card.amount === 0);
      const newCards = cardsNoZeroAmount.map((card) => {
        card.amount -= 1;
        return card.save();
      });
      return Promise.all(newCards).then((savedCards) => [savedCards, cardsZeroAmount]);
    }),
};
