const { celebrate, Joi } = require('celebrate');
const { linkPattern } = require('../utils/constants');


const createUserJoi = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    customerName: Joi.string().required().trim(),
    customerSurName: Joi.string().required().trim(),
    customerFathersName: Joi.string().required().trim(),
    phone: Joi.string().required(),
  }),
});

const verifyUserJoi = celebrate({
  params: Joi.object().keys({
    id: Joi.string().required().hex().length(24),
  }),
});

const updateUserJoi = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email(),
    customerName: Joi.string().required().trim(),
    customerSurName: Joi.string().required().trim(),
    customerFathersName: Joi.string().required().trim(),
    phone: Joi.string().required(),
  }),
});

const loginUserJoi = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
});

const addToBasketJoi = celebrate({
 params: Joi.object().keys({
    cardId: Joi.string().required().hex().length(24),
  }),
});

const updateBasketJoi = celebrate({
  body: Joi.object().keys({
    basket: Joi.array().items(Joi.string().hex().length(24)),
  }),
});

const createOrderJoi = celebrate({
  body: Joi.object().keys({
    postIndex: Joi.number().required(),
    city: Joi.string().required().trim(),
    street: Joi.string().required().trim(),
    house: Joi.string().required().trim(),
    flat: Joi.number().required(),
    basket: Joi.array().items(Joi.object().keys({
      productName: Joi.string().required().trim(),
      description: Joi.string().required(),
      articleNumber: Joi.number().integer().min(0).required(),
      pictureBig: Joi.array().items(Joi.string().required().pattern(linkPattern)),
      pictureSmall: Joi.string().required().pattern(linkPattern),
      price: Joi.number().integer().min(0).required(),
      size: Joi.string().required(),
      material: Joi.string().required(),
      amount: Joi.number().integer().min(0).required(),
      _id: Joi.string().hex().length(24),
    })),
  }),
});

const repeatOrderJoi = celebrate({
  params: Joi.object().keys({
    id: Joi.string().required().hex().length(24),
  }),
});

const createCardJoi = celebrate({
  body: Joi.object().keys({
    productName: Joi.string().required().trim(),
    description: Joi.string().required(),
    articleNumber: Joi.number().integer().min(0).required(),
    pictureBig: Joi.array().items(Joi.string().required().pattern(linkPattern)),
    pictureSmall: Joi.string().required().pattern(linkPattern),
    price: Joi.number().integer().min(0).required(),
    size: Joi.string().required(),
    material: Joi.string().required(),
    amount: Joi.number().integer().min(0).required(),
  }),
});

const deleteCardJoi = celebrate({
  params: Joi.object().keys({
    id: Joi.string().required().hex().length(24),
  }),
});

const changePasswordJoi = celebrate({
  body: Joi.object().keys({
    password: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
});

module.exports = {
  createUserJoi,
  loginUserJoi,
  updateUserJoi,
  verifyUserJoi,
  addToBasketJoi,
  updateBasketJoi,
  createOrderJoi,
  repeatOrderJoi,
  createCardJoi,
  deleteCardJoi,
  changePasswordJoi,
};
