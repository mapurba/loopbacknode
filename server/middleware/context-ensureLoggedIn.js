var loopback = require('loopback');

module.exports = function () {
  return function ensureLoggedIn(req, res, next) {


    // this logic has to be changed if we want to expose our rest apis.
    var reqContext = req.getCurrentContext();
    if (!reqContext.get('currentUser')) {
      var err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    } else {
      next();
    }
  };
};
