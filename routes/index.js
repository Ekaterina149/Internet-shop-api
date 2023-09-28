const router = require('express').Router();
const routerUsers = require('./routesUsers');
const routerCards = require('./routesCards');
const routerOrders = require('./routesOrders');
const { createUser, login, verifyUser } = require('../controllers/users');
const authMiddleware = require('../middlewares/auth');
const NotFoundError = require('../errors/notFoundError');
const { createUserJoi, loginUserJoi, verifyUserJoi} = require('../middlewares/JoiValidation');
// роуты, не требующие авторизации
router.post('/signin', loginUserJoi, login);
router.get('/verify/:id', verifyUserJoi, verifyUser);
router.post('/signup', createUserJoi, createUser);
router.use('/cards', routerCards);

router.use(authMiddleware);
router.get('/signout', (req, res) => {
  res
    .clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    })
    .send({ message: 'Выход' });
});
router.use('/users', routerUsers);
router.use('/orders', routerOrders);

router.use(() => {
  throw new NotFoundError("Sorry can't find that!");
});
module.exports = router;
