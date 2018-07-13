var getCurrentUser = require('../middleware/context-currentUser');
var ensureLoggedIn = require('../middleware/context-ensureLoggedIn');

module.exports = function (server) {
  var router = server.loopback.Router();
  // if (!process.env.SKIP_FRONTEND) {
  router.get('/', getCurrentUser(), function (req, res, next) {
    var ctx = req.myContext;
    console.log(ctx);
    var currentUser = ctx.get('currentUser');
    res.render('pages/home', {
      'user': currentUser,
      'alert': req.query.alert,
      'ip': req.ip
    });
    // res.json(200,'dd');
  });

  router.get('/ogtags', function (req, res, next) {
    res.render('pages/og', {});
  });

  router.get('/ogtagsss', function (req, res, next) {
    res.json(200, 'ada');
  });

  router.get('/register', function (req, res, next) {
    res.render('pages/register');
  });

  router.post('/register', function (req, res, next) {
    server.models.MyUser.create({
      email: req.body.email,
      password: req.body.password
    }, function (err, user) {
      if (err) {
        res.status('400').send(err);
      }
      else {
        // res.redirect('/?alert=registered,+please+log+in');
        console.log(user);
        res.json(200, 'da')

      }
    });

  });

  router.get('/UserDetail', getCurrentUser(), ensureLoggedIn(), function (req, res, next) {
    var ctx = req.myContext;
    var currentUser = ctx.get('currentUser');

    res.send(currentUser);

  });
  // }

  server.use(router);
};
