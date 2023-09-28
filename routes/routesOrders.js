const routerOrders = require('express').Router();

const {
  getOrders,
  createOrder,
  repeatOrder,
  deleteOrder,

} = require('../controllers/orders');

const { createOrderJoi, repeatOrderJoi } = require('../middlewares/JoiValidation');

routerOrders.post('', createOrderJoi, createOrder);
routerOrders.get('', getOrders);
routerOrders.post('/:id', repeatOrderJoi, repeatOrder);
routerOrders.delete('/:id', repeatOrderJoi, deleteOrder);

module.exports = routerOrders;
