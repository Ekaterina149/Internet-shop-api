const mongoose = require('mongoose');
const validator = require('validator');
const { cardSchema } = require('./card');

const orderSchema = new mongoose.Schema(
  {
    orderItems: { type: [cardSchema] },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'поле "owner" не может быть пустым'],

    },

    postIndex: {
      type: Number,
      required: [true, 'поле "postIndex" не может быть пустым'],
    },
    city: {
      type: String,
      required: [true, 'поле "city" не может быть пустым'],
    },
    street: {
      type: String,
      required: [true, 'поле "street" не может быть пустым'],
    },
    house: {
      type: String,
      required: [true, 'поле "house" не может быть пустым'],
    },
    flat: {
      type: Number,
      required: [true, 'поле "flat" не может быть пустым'],
    },
    paid: {
      type: Boolean,

      default: false,
    },
    status: {
      type: String,
      enum: ['собран', 'отправлен', 'доставлен'],
      default: 'собран',
    },

  },

  {
    versionKey: false,
  },
);

module.exports = mongoose.model('order', orderSchema);
module.exports.orderSchema = orderSchema;
