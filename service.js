const User = require("./models/user");
const mongoose = require('mongoose');
const { PORT = 3001, MONGO_URL = 'mongodb://127.0.0.1/wickershopdb' } = process.env;
mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
  });

// Предположим, что ваша модель данных называется User, и у вас уже есть соединение с базой данных

// Функция для очистки корзины пользователя
async function clearBasket(userId) {
  try {
    await User.findByIdAndUpdate(userId, { basket: [], addTobasketTime: null }); // Очистить корзину
    console.log(`Корзина пользователя ${userId} очищена.`);
  } catch (error) {
    console.error('Ошибка при очистке корзины:', error);
  }
}

// Получение списка пользователей с непустым полем addTobasketTime
async function getUsersWithNonEmptyAddToBasketTime() {
  try {
    const users = await User.find({ addTobasketTime: { $ne: null } }); // Найти всех пользователей с непустым полем addTobasketTime
    const currentTime = new Date(); // Получить текущее время

    users.forEach((user) => {
      if (user.addTobasketTime && currentTime - user.addTobasketTime > 3 * 60 * 60 * 1000) { // Сравнить и очистить корзину, если время превышает 3 часа
        clearBasket(user._id);
      }
    });
  } catch (error) {
    console.error('Ошибка при обработке задачи очистки корзины:', error);
  }
}

// Вызов функции для получения пользователей с непустым полем addTobasketTime
getUsersWithNonEmptyAddToBasketTime();

// Запланировать повторение задачи через определенный интервал времени
module.exports.run =()=>{
  setInterval(() => {
    getUsersWithNonEmptyAddToBasketTime(); // Выполнить проверку по истечении каждого интервала времени
  },   60*1000*60*3); // Повторять каждый час
}
