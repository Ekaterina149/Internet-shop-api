const mongoose = require('mongoose');
const validator = require('validator');

const cardSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'поле "productName" не может быть пустым'],

    },
    description: {
      type: String,
      required: [true, 'поле "description" не может быть пустым'],
    },

    articleNumber: {
      type: Number,
      required: [true, 'поле "articleNumber" не может быть пустым'],
    },

    pictureBig: {
      type: [{
        type: String,

        required: [true, 'поле "pictureBig" не может быть пустым'],
      },

      ],
    },
    pictureSmall: {
      type: String,

      required: [true, 'поле "pictureSmall" не может быть пустым'],

    },
    price: {
      type: Number,
      required: [true, 'поле "priсe" не может быть пустым'],
    },
    amount: {
      type: Number,
      required: [true, 'поле "amount" не может быть пустым'],

    },

    size: {
      type: String,
      required: [true, 'поле "size" не может быть пустым'],
    },
    material: {
      type: String,
      required: [true, 'поле " material" не может быть пустым'],
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model('card', cardSchema);
module.exports.cardSchema = cardSchema;
