const routerCards = require('express').Router();

const {
  getCards,
  createCard,
  deleteCard,

} = require('../controllers/cards');

const { createCardJoi, deleteCardJoi } = require('../middlewares/JoiValidation');

routerCards.post('', createCardJoi, createCard);
routerCards.get('', getCards);
routerCards.delete('/:id', deleteCardJoi, deleteCard);

module.exports = routerCards;
