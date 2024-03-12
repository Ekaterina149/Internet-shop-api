const { NODE_ENV, JWT_SECRET, DOMAIN_NAME } = process.env;
const httpConstants = require("http2").constants;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Card = require("../models/card");
const mailer = require("../orderData/nodemailer");
const AuthError = require("../errors/authError");
const NotFoundError = require("../errors/notFoundError");
const BadRequestError = require("../errors/badRequestError");
const ConflictError = require("../errors/conflictError");
const ForbiddenError = require("../errors/forbiddenError");
const ZeroAmountError = require("../errors/zeroAmountError");
const { devNull } = require("os");

const { HTTP_STATUS_CREATED, HTTP_STATUS_OK } = httpConstants;
function validateCatchAll(err, next, defaultMessage) {
  if (err.name === "DocumentNotFoundError")
    return next(new NotFoundError("Пользователь с указанным _id не найден."));

  if (err.name === "CastError")
    return next(new BadRequestError("Передан некорректный _id пользователя"));

  if (err.name === "ValidationError") {
    const errArray = Object.values(err.errors);
    const messages = errArray
      .map((element, index) => `№${index + 1}. ${element.message}`)
      .join(", ");
    return next(
      new BadRequestError(messages.length ? messages : defaultMessage)
    );
  }
  if (err.code === 11000)
    return next(new ConflictError("Такой email уже есть в базе"));

  return next(err);
}

const saveCards = async (cardsArray, objUpdatedBasket) => {
  const updatedCards = [];
  if (cardsArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [element, count] of objUpdatedBasket) {
      const cardToDecrement = cardsArray.find(
        (card) => card._id.toString() === element
      );
      if (cardToDecrement) {
        cardToDecrement.amount -= count;
        // eslint-disable-next-line no-await-in-loop
        updatedCards.push(await cardToDecrement.save());
      }
    }

    return updatedCards;
  }
  // throw new ZeroAmountError("Товаров из Вашей корзины нет в наличии");
};

const updateCards = (cards, basket) => {
  const cardsID = cards.map((card) => card._id.toString());
  console.log("card.id", cardsID);
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

  return saveCards(cardsNoZeroAmount, objUpdatedBasket).then((updatedCards) => [
    updatedCards,
    cardsZeroAmount,
    updatedBasket,
  ]);
};

const incrementAndSaveCards = async (cardsArray, objCards) => {
  const updatedCards = [];
  console.log("длина массива карточек", cardsArray.length);
  if (cardsArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [element, count] of objCards) {
      const cardToIncrement = cardsArray.find(
        (card) => card._id.toString() === element
      );
      if (cardToIncrement) {
        cardToIncrement.amount += count;
        // eslint-disable-next-line no-await-in-loop
        updatedCards.push(await cardToIncrement.save());
      }
    }
    return updatedCards;
  }
  throw new ZeroAmountError("Товаров из Вашего заказа нет базе");
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .select()
    .then((users) => res.send(users))
    .catch((err) => next(err));
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.userId)
    // .select()
    .populate('orders')
    .orFail()
    .then((user) => res.send(user))
    .catch((err) => validateCatchAll(err, next, ""));
};
module.exports.createUser = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 12)
    .then((hash) => {
      const {
        name,
        email,
        customerName,
        customerSurName,
        customerFathersName,
        phone,
      } = req.body;
      return User.create({
        name,
        email,
        customerName,
        customerSurName,
        customerFathersName,
        phone,
        password: hash,
      });
    })
    .then((user) => {
      const message = {
        to: `${user.email}`,
        subject: `Подтверждение регистрации пользователя ${user.customerSurName} ${user.customerName} ${user.customerFathersName}`,
        html: `<h2>Подтверждение регистрации на сайте Интернет магазин изделий из лозы loza-shop-order@mail.ru</h2>
        <p>Имя пользователя ${user.name}</p>
        <p>Электронная почта ${user.email}</p>
        <p>Пароль ${req.body.password}</p>
        <p>Для подтверждения регистрации перейдите по ссылке
        <a href ='${DOMAIN_NAME}/api/verify/${user._id}'>${DOMAIN_NAME}/api/verify/${user._id}</a>
        </p>
        `,
      };
      mailer(message);
      return res.send(user.toObject({ useProjection: true }));
    })
    .catch((err) =>
      validateCatchAll(err, next, "Переданы некорректные  данные пользователя")
    );
};
module.exports.verifyUser = (req, res, next) =>
  User.findOne({ _id: req.params.id })
    .orFail()
    .then((user) => {
      if (!user) throw new NotFoundError("Нерабочая ссылка");

      // eslint-disable-next-line no-param-reassign
      user.verified = true; // Установка значения verified в true

      return user.save().then(() => res.redirect("https://www.google.com"));
    })
    .catch((err) =>
      validateCatchAll(err, next, "Переданы некорректные данные верификации")
    );

module.exports.updateUser = (req, res, next) => {
  const {
    name,
    email,
    phone,
    customerName,
    customerFathersName,
    customerSurName,
  } = req.body;

  // Возврат User.findByIdAndUpdate, чтобы он стал частью цепочки промисов
  User.findByIdAndUpdate(
    req.user._id,
    { name, email, phone, customerName, customerFathersName, customerSurName },
    { new: true, runValidators: true }
  )
    .orFail() // Метод orFail должен быть вызван после User.findByIdAndUpdate и возвращать промис

    .then((user) => res.send(user))
    .catch((err) =>
      validateCatchAll(
        err,
        next,
        "Переданы некорректные данные при обновлении профиля"
      )
    );
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .select("+password")
    .populate('basket' )
    .populate('orders')
    .then((user) => {
      if (!user) {
        return next(new AuthError("Неправильные почта или пароль"));
      }
      if (!user.verified) {
        return next(
          new ForbiddenError(
            "Зайдите на Вашу электронную почту и подтвердите Ваш аккаунт"
          )
        );
      }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return next(new AuthError("Неправильные почта или пароль"));
        }
        const token = jwt.sign(
          { _id: user._id },
          NODE_ENV === "production" ? JWT_SECRET : "some-secret-key",
          { expiresIn: "7d" }
        );

        res.cookie("jwt", token, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней в миллисекундах
          httpOnly: true,
          // sameSite: 'None',
          // secure: true,
        });

        return res.send(user);
      });
    })
    .catch((err) => next(err));
};

module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .populate("basket")
    .populate("orders")
    .orFail()
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === "DocumentNotFoundError") {
        return next(
          new NotFoundError("Пользователь с указанным _id не найден.")
        );
      }

      return next(err);
    });
};

module.exports.addToBasket = (req, res, next) => {
  Card.findById(req.params.cardId)
    .orFail()
    .then((card) => {
      if (card.amount > 0) {
        // eslint-disable-next-line no-param-reassign, no-return-assign
        card.amount -= 1;
        return card.save();
      }

      throw new ForbiddenError(
        "Товара нет в наличии, свяжитесь с продавцом, если хотите, чтобы изделие было изготовлено под Ваш заказ"
      );
    })

    .then((newCard) => {
      // res.status(HTTP_STATUS_OK).send(newCard);
      console.log(newCard._id.toString());
      const addTobasketTime = new Date();
      return User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { basket: req.params.cardId },
          $set: { addTobasketTime: addTobasketTime },
        },
        { new: true }
      ).populate("basket");
    })
    .then((user) => {
      console.log("a", user);
      // debugger;
      res.status(HTTP_STATUS_OK).send(user);
    })
    .catch((err) => {
      if (err.name === "DocumentNotFoundError") {
        return next(
          new NotFoundError("Карточка  товара с указанным _id не найдена.")
        );
      }
      if (err.name === "CastError") {
        return next(
          new BadRequestError(
            "Переданы некорректные данные при добавлении товара в корзину"
          )
        );
      }
      if (err.name === "ForbiddenError") {
        return next(new ForbiddenError(err.message));
      }
      return next(err);
    });
};

module.exports.deleteFromBasket = (req, res, next) => {
  User.findById(req.user._id)
    .orFail()
    .then((user) => {
      debugger;
      console.log(user.basket);
      if (user.basket.indexOf(req.params.cardId) !== -1) {
        user.basket.splice(user.basket.indexOf(req.params.cardId), 1);
        return user.save();
      }
      throw new NotFoundError("Карточка не найдена в корзине");
    })
    .then((newUser) => {
      return User.populate(newUser, { path: "basket" });
    })
    .then((populatedUser) => {
      res.status(HTTP_STATUS_OK).send(populatedUser);
      return Card.findById(req.params.cardId);
    })
    .then((card) => {
      if (card) {
        card.amount += 1;
        return card.save();
      }
      throw new NotFoundError("Карточка не найдена в базе");
    })
    .then(() => {
      // Выполнение дополнительных действий при успешном результате
    })
    .catch((err) => {
      if (err.name === "NotFoundError") {
        return next(new NotFoundError(err.message));
      }
      return next(err);
    });
};

module.exports.updateBasket = (req, res, next) => {
  const { basket } = req.body;
  const uniqueArray = [...new Set(basket)];

  if (!basket.length) {
    User.findByIdAndUpdate(req.user._id, { basket: [], addTobasketTime: null }, { new: true })
      .then((user) => {
        res.status(HTTP_STATUS_OK).send(user);
      })
      .catch((err) => next(err));
  } else {
    Card.find({ _id: { $in: uniqueArray } })
      .orFail()
      .then((cards) => updateCards(cards, basket))
      .then(([updatedCards, cardsZeroAmount, updatedBasket]) => {
        console.log("updatedBasket", updatedBasket);
        return Promise.all([
          User.findByIdAndUpdate(
            req.user._id,
            { $push: { basket: { $each: updatedBasket } } },
            { new: true }
          ).populate("basket"),
          cardsZeroAmount,
        ]);
      })
      .then(([user, cardsZeroAmount]) => {
        res.status(HTTP_STATUS_OK).send({ user, cardsZeroAmount });
      })
      .catch((err) => {
        if (err.name === "DocumentNotFoundError") {
          return next(
            new NotFoundError(
              "Карточки товара из Вашей корзины не найдены в базе данных"
            )
          );
        }
        if (err.name === "CastError") {
          return next(
            new BadRequestError(
              "Переданы некорректные данные при добавлении товара в корзину"
            )
          );
        }
        if (err.name === "ZeroAmountError") {
          return next(new ZeroAmountError(err.message));
        }
        return next(err);
      });
  }
};

module.exports.deleteSeveralFromBasket = (req, res, next) => {
  const { basket } = req.body;
  const uniqueArray = [...new Set(basket)];
  const cardId = uniqueArray[0];
  console.log(uniqueArray);
  User.findById(req.user._id)
    .orFail()
    .then((user) => {
      if (user.basket.includes(cardId)) {
        user.basket.pull(cardId);
        return user.save();
      }
      throw new NotFoundError("Карточка не найдена в корзине");
    })
    .then((newUser) => {
      return User.populate(newUser, { path: "basket" });
    })
    .then((populatedUser) => {
      res.status(HTTP_STATUS_OK).send(populatedUser);
      return Card.findById(cardId);
    })
    .then((card) => {
      if (card) {
        card.amount = card.amount + basket.length;
        return card.save();
      }
      throw new NotFoundError("Карточка не найдена в базе");
    })
    .then(() => {
      // Выполнение дополнительных действий при успешном результате
    })
    .catch((err) => {
      if (err.name === "NotFoundError") {
        return next(new NotFoundError(err.message));
      }
      return next(err);
    });
};

module.exports.clearBasket = (req, res, next) => {
  const { basket } = req.body;
  const uniqueArray = [...new Set(basket)];

  return (
    User.findByIdAndUpdate(req.user._id, { basket: [] }, { new: true })
      // .orFail()
      .then((user) => {
        const objCards = new Map();
        // создаем объект со структурой id товара => количество в заказе
        // eslint-disable-next-line no-restricted-syntax
        for (const element of basket) {
          objCards.set(element, (objCards.get(element) || 0) + 1);
        }
        return Card.find({ _id: { $in: uniqueArray } })
          .then((cards) => incrementAndSaveCards(cards, objCards))
          .then((incrementCards) =>
            res.status(HTTP_STATUS_OK).send(incrementCards)
          );
      })
      .catch((err) => {
        if (err.name === "DocumentNotFoundError") {
          return next(
            new NotFoundError(
              "Карточки товара из Вашей корзины не найдены в базе данных"
            )
          );
        }
        if (err.name === "CastError") {
          return next(
            new BadRequestError(
              "Переданы некорректные данные при удалении товаров из корзины"
            )
          );
        }
        if (err.name === "ZeroAmountError") {
          return next(new ZeroAmountError(err.message));
        }
        return next(err);
      })
  );
};

module.exports.changePassword = (req, res, next) => {
  const { password, newPassword } = req.body;
  User.findById(req.user._id)
    .select("+password")
    .populate("basket")
    .then((user) => {
      // if (!user) {
      //   return next(new AuthError('Неправильные почта или пароль'));
      // }
      // if (!user.verified) {
      //   return next(new ForbiddenError('Зайдите на Вашу электронную почту и подтвердите ВАш аккаунт'));
      // }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return next(new AuthError("Ваш прежний пароль введен неправильно"));
        }

        return Promise.all([user, bcrypt.hash(newPassword, 12)])
          .then(([user, newHash]) => {
            console.log("newHash", newHash);
            user.password = newHash;
            return user.save();
          })
          .then((userWithNewPassword) =>
            res.status(HTTP_STATUS_OK).send(userWithNewPassword)
          );
      });
    })
    .catch((err) => next(err));
};
