require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const { errors } = require('celebrate');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./routes');
const {run} = require('./service')

const app = express();
const { requestLogger, errorLogger } = require('./middlewares/logger');
const { handleErrors } = require('./middlewares/handleErrors');

const { PORT = 3001, NODE_ENV, MONGO_URL = 'mongodb://127.0.0.1/wickershopdb' } = process.env;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
});
app.use(requestLogger);
app.use(helmet());

app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://lozashop.ru'
    ],
    credentials: true,
  }),
);
// корневой роут
app.use('/api', router);
app.use(errorLogger);
app.use(errors({ message: 'Ошибка валидации Joi!' }));
app.use(handleErrors);
app.use(run);
app.listen(PORT, () => {
  // Если всё работает, консоль покажет, какой порт приложение слушает
  console.log(`App listening on port ${PORT} ${NODE_ENV}`);

});
