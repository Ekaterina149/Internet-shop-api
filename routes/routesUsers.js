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
  deleteSeveralFromBasket,
  changePassword,

} = require('../controllers/users');

 const { updateUserJoi, addToBasketJoi, updateBasketJoi, changePasswordJoi } = require('../middlewares/JoiValidation');

routerUsers.get('', getUsers);
routerUsers.get('/me', getCurrentUser);
routerUsers.patch('/me', updateUserJoi, updateUser);
routerUsers.put('/me/basket/:cardId', addToBasketJoi, addToBasket);
routerUsers.delete('/me/basket/:cardId', addToBasketJoi, deleteFromBasket);
routerUsers.patch('/me/basket/cards', updateBasketJoi, deleteSeveralFromBasket);
routerUsers.patch('/me/basket', updateBasketJoi, updateBasket);
routerUsers.post('/me/basket', updateBasketJoi, clearBasket);
routerUsers.post('/me/password', changePasswordJoi, changePassword );

module.exports = routerUsers;
