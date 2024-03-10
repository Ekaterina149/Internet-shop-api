/* eslint-disable no-unused-vars */
const httpConstants = require('http2').constants;
// eslint-disable-next-line import/no-extraneous-dependencies
// const { EJSON } = require('bson');
const mailer = require('../orderData/nodemailer');
const ForbiddenError = require('../errors/forbiddenError');
const NotFoundError = require('../errors/notFoundError');
const BadRequestError = require('../errors/badRequestError');
const ZeroAmountError = require('../errors/zeroAmountError');
const Order = require('../models/order');
const User = require('../models/user');
const Card = require('../models/card');
const { findAndReduceCardAmount } = require('../utils/constants');

const { HTTP_STATUS_CREATED, HTTP_STATUS_OK } = httpConstants;

const saveCards = async (cardsArray, objUpdatedBasket) => {
  const updatedCards = [];
  if (cardsArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [element, count] of objUpdatedBasket) {
      const cardToDecrement = cardsArray.find((card) => card._id.toString() === element);
      if (cardToDecrement) {
        cardToDecrement.amount -= count;
        // eslint-disable-next-line no-await-in-loop
        updatedCards.push(await cardToDecrement.save());
      }
    }
    return updatedCards;
  } throw new ZeroAmountError('Товаров из Вашей корзины нет в наличии');
};

const updateCards = (cards, basket) => {
  const cardsID = cards.map((card) => card._id.toString());
  // console.log('card.id', cardsID);
  const objCards = new Map();
  const objBasket = new Map();
  const objUpdatedBasket = new Map();
  const updatedBasket = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const element of cards) {
    objCards.set(element._id.toString(), element.amount);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const element of basket) {
    objBasket.set(element, (objBasket.get(element) || 0) + 1);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of objCards) {
    if (objCards.has(key)) {
      objUpdatedBasket.set(key, Math.min(value, objBasket.get(key)));
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const [element, count] of objUpdatedBasket) {
    updatedBasket.push(...Array(count).fill(element));
  }

  const cardsNoZeroAmount = cards.filter((card) => card.amount > 0);
  const cardsZeroAmount = cards.filter((card) => card.amount === 0);

  return saveCards(cardsNoZeroAmount, objUpdatedBasket)
    .then((updatedCards) => [updatedCards, cardsZeroAmount, updatedBasket]);
};
const findIds = (order) => order.orderItems
  .map((card) => card._id.toString());
const incrementAndSaveCards = async (cardsArray, objCards) => {
  const updatedCards = [];
  if (cardsArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [element, count] of objCards) {
      const cardToIncrement = cardsArray.find((card) => card._id.toString() === element);
      if (cardToIncrement) {
        cardToIncrement.amount += count;
        // eslint-disable-next-line no-await-in-loop
        updatedCards.push(await cardToIncrement.save());
      }
    }
    return updatedCards;
  } throw new ZeroAmountError('Товаров из Вашего заказа нет базе');
};

function formMessageText(order, user, word) {
  const transformedArray = order.orderItems.map((element) => ({
    productName: element.productName,
    description: element.description,
    articleNumber: element.articleNumber,
    price: element.price,
    id: element._id.toString(),
  })).reduce(
    (acc , curr) => {
      const existingIndex = acc.findIndex((item) => item._id === curr._id);
      if (existingIndex !== -1) {
        acc[existingIndex] = {
          ...curr,
          quantity: acc[existingIndex].quantity + 1,
        };
      } else {
        acc.push({ ...curr, quantity: 1 });
      }
      return acc;
    },
    []
  );



  console.log('array', transformedArray);

  const arrayItems = transformedArray.map((item) => `<li>
    <p>Название продукта: ${item.productName}</p>
    <p>Описание: ${item.description}</p>
    <p>Артикул: ${item.articleNumber}</p>
    <p>Цена: ${item.price} руб. </p>
    <p>Количество: ${item.quantity}</p>
  </li>`).join('');
  // eslint-disable-next-line max-len
  const summPrice = transformedArray.reduce((sum, currentItem) => sum + (currentItem.price * currentItem.quantity), 0);
  console.log('summPrice', summPrice);
  console.log('arrayItems', arrayItems);
  const message = {
    to: `<${user.email}>, <loza-shop-order@mail.ru>`,
    subject: `${word} заказ пользователя ${user.customerSurName} ${user.customerName} ${user.customerFathersName}  № ${order._id} оформлен`,
    html: `
    <h2>Информация о заказе № ${order._id}</h2>
    <p>${user.customerSurName}</p>
    <p>${user.customerName}</p>
    <p>${user.customerFathersName}</p>
    <p>${user._id}</p>

    <p> Индекс: ${order.postIndex}</p>
    <p> город:${order.city}</p>
    <p> улица:${order.street}</p>
    <span> дом:${order.house}</span>
    <span> квартира:${order.flat}</span>

 <ul>${arrayItems}</ul>
 <p>К оплате: ${summPrice} руб.</p>
 `,

  };
  return message;
}
module.exports.getOrders = (req, res, next) => {
  Order.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .then((orders) => res.status(HTTP_STATUS_OK).send(orders))
    .catch((err) => next(err));
};
module.exports.createOrder = (req, res, next) => {
  const {
    postIndex,
    city,
    street,
    house,
    flat,
    basket,
  } = req.body;
  // создаем новый заказ с карточками товаров из корзины
  return (
    Order.create({
      postIndex,
      city,
      street,
      house,
      flat,

      orderItems: basket,
      owner: req.user._id,
    }))
    .then((newOrder) => newOrder)
    // добавим id созданного заказа в поле orders документа пользователя
    .then((order) => Promise.all([User.findByIdAndUpdate(
      req.user._id,
      { $push: { orders: order._id.toString() } },
      { new: true },
    ), order]))
    .then(([user, order]) => {
       const message = formMessageText(order, user, 'Новый');
       mailer(message);
      return res.status(HTTP_STATUS_OK).send(order);
    })
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
              : 'Переданы некорректные данные при создании заказа',
          ),
        );
      }
      return next(err);
    });
};

module.exports.repeatOrder = (req, res, next) => Order.findOne({ _id: req.params.id })
  .orFail()
  .then((order) => {
    // создаем массив с id карточек из прежнего заказа
    const listCardsID = findIds(order);
    // создадим новый массив, уберем повторяющиеся id (если каких-то товаров заказано несколько)
    const uniqueArray = [...new Set(listCardsID)];
    // ищем товары в коллекции карточек
    return Card.find({ _id: { $in: uniqueArray } })
      .then((c) =>
        // карточки найдены в базе, приведем состав товаров заказа в соответствие с наличием
        // в коллекции cards
        // функция возвращает обновленный массив карточек на сервере, товары,
        // количество которых в базе равно нулю, обновленную корзину с  id карточек
        updateCards(c, listCardsID))
      .then(([updatedCards, cardsZeroAmount, updatedBasket]) => {
        // let newOrder;
        if (!updatedBasket.length) {
          throw new ZeroAmountError('Обновленная корзина пуста');
        }
        // Создаём новый массив, включающий неповоторяющиеся карточки
        //  из обновленной корзины
        const array = [...new Set(updatedBasket)];
        return Card.find({ _id: { $in: array } })
          .then((cards) => {
            const resultArray = [];
            updatedBasket.forEach((basketId) => {
              const matchingCards = cards.filter((card) => card._id.toString() === basketId);
              resultArray.push(...matchingCards);
            });
            // результирующий массив - это карточки товаров, которые добавим во вновь созданный заказ
            return resultArray;
          });
      })
      .then((resCards) => Order.create({
        postIndex: order.postIndex,
        city: order.city,
        street: order.street,
        house: order.house,
        flat: order.flat,
        orderItems: resCards,
        owner: req.user._id,
      }))
      .then((newOrder) => {
        console.log('order', newOrder);
        // добавим в поле заказов id нового заказа
        return User.findByIdAndUpdate(
          req.user._id,
          { $push: { orders: newOrder._id.toString() } },
          { new: true },
        )

          .then((user) => {
            // console.log(user);
            mailer(formMessageText(newOrder, user, 'Новый'));
            return res.status(HTTP_STATUS_OK).send(newOrder);
          });
      });
  })
  .catch((err) => {
    if (err.name === 'DocumentNotFoundError') {
      return next(new NotFoundError('Заказ или карточки с указанным _id не найдены.'));
    }
    if (err.name === 'CastError') {
      return next(
        new BadRequestError(
          'Переданы некорректные данные при дублирования заказа.',
        ),
      );
    }
    if (err.name === 'ZeroAmountError') {
      return next(new ZeroAmountError(err.message));
    }

    return next(err);
  });
module.exports.deleteOrder = (req, res, next) => Order.findOne({ _id: req.params.id })
  .orFail()
  .then((order) => {
    const cardIDs = findIds(order);
    const objCards = new Map();
    // создаем объект со структурой id товара => количество в заказе
    // eslint-disable-next-line no-restricted-syntax
    for (const element of cardIDs) {
      objCards.set(element, (objCards.get(element) || 0) + 1);
    }
    // Создаём новый массив, включающий неповоторяющиеся карточки
    //  из обновленной корзины
    const array = [...new Set(cardIDs)];
    return Card.find({ _id: { $in: array } })
      .then((cards) => incrementAndSaveCards(cards, objCards))
      .then(() => User.findByIdAndUpdate(
        req.user._id,
        { $pull: { orders: order._id.toString() } },
        { new: true },
      ))
      .then((user) => order.deleteOne()
        .then((deletedOrder) => {
          mailer(formMessageText(deletedOrder, user, 'Удаленный'));
          return res.status(HTTP_STATUS_OK).send(deletedOrder);
        }));
  })
  .catch((err) => {
    if (err.name === 'DocumentNotFoundError') {
      return next(new NotFoundError('Заказ с указанным _id не найден.'));
    }
    if (err.name === 'CastError') {
      return next(
        new BadRequestError(
          'Переданы некорректные данные при удалении заказа.',
        ),
      );
    }

    return next(err);
  });
