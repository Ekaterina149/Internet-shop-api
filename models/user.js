const mongoose = require('mongoose');
const validator = require('validator');
const { orderSchema } = require('./order');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Поле "name" не может быть пустым'],
      minlength: [2, 'Минимальная длина поля "name" -2'],
      maxlength: [30, 'Максимальная длина поля "name" -30'],

    },

    email: {
      type: String,
      validate: {
        validator(v) {
          return validator.isEmail(v, { allow_utf8_local_part: false });
        },
        message: 'Введите корректную почту',
      },
      required: [true, 'Поле "email" не может быть пустым'],
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: [true, 'Поле "password" не может быть пустым'],
    },
    customerName: {
      type: String,
      required: [true, 'поле "customerName" не может быть пустым'],
    },
    customerSurName: {
      type: String,
      required: [true, 'поле "customerSurName" не может быть пустым'],
    },
    customerFathersName: {
      type: String,
      required: [true, 'поле "customerFathersName" не может быть пустым'],
    },
    basket: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'card',
      }],
      default: [],
    },
    orders: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
      }],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: [true, 'поле "phone" не может быть пустым'],
    },
  },
  {
    versionKey: false,
  },
);
module.exports = mongoose.model('user', userSchema);
