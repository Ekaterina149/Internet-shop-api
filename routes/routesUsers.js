const routerUsers = require('express').Router();

// const Card = require('../models/user');
const {
  getUsers,
  updateUser,
  getCurrentUser,
  addToBasket,
  deleteFromBasket,
  updateBasket,
  clearBasket,

} = require('../controllers/users');

 const { updateUserJoi, addToBasketJoi, updateBasketJoi } = require('../middlewares/JoiValidation');

routerUsers.get('', getUsers);
routerUsers.get('/me', getCurrentUser);
routerUsers.patch('/me', updateUserJoi, updateUser);
routerUsers.put('/me/basket/:cardId', addToBasketJoi, addToBasket);
routerUsers.delete('/me/basket/:cardId', addToBasketJoi, deleteFromBasket);
routerUsers.patch('/me/basket', updateBasketJoi, updateBasket);
routerUsers.post('/me/basket', updateBasketJoi, clearBasket);

module.exports = routerUsers;
