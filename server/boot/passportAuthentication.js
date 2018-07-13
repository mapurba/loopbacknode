var loopback = require('loopback');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var sessions = require('express-session');
var getCurrentUser = require('../middleware/context-currentUser')();
var uuid = require('uuid');
var VError = require('verror').VError;
var WError = require('verror').WError;
var _ = require('lodash');

var TWO_WEEKS = 60 * 60 * 24 * 7 * 2;

module.exports = function enableAuthentication(server) {

  if (process.env.SKIP_PASSPORT) {
    return;
  }

  var UserModel = server.models.MyUser;

  var router = server.loopback.Router();

  server.use(router);


  // setup google strategy
  passport.use(new GoogleStrategy({
    clientID: '159193000354-gbjilatpc9vtitebna0lcaan8g8p81u8.apps.googleusercontent.com',
    clientSecret: 'jMgEnKEUMufIeYCd1vFkX3pW',
    callbackURL: '/auth/google/callback',
    profileFields: ['email', 'profile'],
    passReqToCallback: true
  }, providerFacebook));


  function providerFacebook(req, token, tokenSecret, profile, done) {
    providerHandler('google', req, token, tokenSecret, profile, done);
  }


  // initiate google authentication
  router.get('/auth/google', getCurrentUser, passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false
  }));

  // facebook callback
  // need access to the http context in order to handle login so wrap the passportResultHandler in closure
  router.get('/auth/google/callback', getCurrentUser, function (req, res, next) {
    passport.authenticate('google', function (err, user, info) {
      passportResultHandler('google', err, user, info, req, res, next);
    })(req, res, next);
  });


  // ==========================================================
  // utility fuctions to integrate passport with our user model
  // ==========================================================

  // back from passport
  function passportResultHandler(provider, err, user, info, req, res, next) {
    var ctx = req.getCurrentContext();

    var currentUser = ctx.get('currentUser');

    if (err) {

      // id is already linked to a User or email address in use by a User
      if (err.message === "identity-already-linked" || err.message === "email-in-use") {
        console.log('error', 'passportResultHandler %j', err, {});
        return res.redirect('/?alert=' + err.message);
      } else { // something else went wrong in passport
        var e = new WError(err, 'passportResultHandler error');
        console.log(e.message);
        console.log(e.stack);
        return next(e);
      }
    }

    if (!user) { // user aborted authorization
      return res.redirect('/?alert=' + provider + '-link-failed');
    }

    // already logged in
    if (currentUser) {
      res.redirect('/');
    } else { // log the user in
      doLogin(user, function (err, accessToken) {
        if (!err) {
          res.cookie('access_token', accessToken.id, {
            signed: req.signedCookies ? true : false,
            maxAge: 1000 * accessToken.ttl
          });
        }

        res.redirect('/');
      });
    }
  }

  // create an access token to log in the user
  function doLogin(user, cb) {
    console.log(user.id);
    UserModel.findById(user.id, function (err, user) {

      if (err) {
        var e = new VError(err, 'doLogin: User.findById error');
        return cb(e);
      }

      if (!user) {
        var e = new VError(err, 'doLogin: user not found id: ');
        return cb(e);
      }

      user.createAccessToken(TWO_WEEKS, function (err, accessToken) {
        if (err) {
          var e = new VError(err, 'doLogin: user.createAccessToken error');
          return cb(e);
        }
        cb(null, accessToken);
      });

    });
  }

  // set up users and identities
  function providerHandler(provider, req, token, tokenSecret, profile, done) {
    var ctx = req.getCurrentContext();
    var currentUser = ctx.get('currentUser');

    var query = {
      'where': {
        'and': [{
          'provider': provider
        }, {
          'externalId': profile.id
        }]
      },
      'include': ['user']
    };

    server.models.UserIdentity.findOne(query, function (err, identity) {
      if (err) {
        var e = new VError(err, 'providerHandler: UserIdentity.findOne error');
        return done(e);
      }

      // logged in, link account to current user
      if (currentUser) {

        // if identity found, does it belong to the current logged in user?
        if (identity && identity.userId !== currentUser.id) {
          var e = new VError('identity-already-linked');
          return done(e);
        }

        // create identity if it does not exist
        if (!identity) {
          identity = {
            provider: provider,
            externalId: profile.id,
            userId: currentUser.id
          };
        }

        // update with current info from profile
        identity.credentials = {
          token: token,
          secret: tokenSecret
        };
        identity.profile = profile;

        server.models.UserIdentity.upsert(identity, function (err, identity) {
          if (err) {
            var e = new VError(err, 'providerHandler: UserIdentity.upsert error');
            return done(e);
          }

          // already logged in so just pass user back to passport
          return done(null, currentUser, null);
        });
      } else {
        if (identity) {
          // UserIdentity exists for profile id, update UserIdentity with new token and profile and login
          identity.credentials = {
            token: token,
            secret: tokenSecret
          };
          identity.profile = profile;

          identity.save(function (err) {
            if (err) {
              var e = new VError(err, 'providerHandler: UserIdentity.save');
              return done(e);
            }

            done(null, identity.user());
          });
        } else {

          // identity does not exist for this profile id, create a user and identity and login
          var user = {
            username: 'passport-user-' + uuid.v4(),
            email: 'passport-user-' + uuid.v4() + '-' + profile.id + '@digitopia.com',
            password: uuid.v4(),
            status: 'active'
          };

          user = profileToUser(profile, user); // get name and email etc from passport profile

          // create the User
          UserModel.findOne({
            'where': {
              'email': user.email
            }
          }, function (err, existingUser) {
            if (err) {
              var e = new VError(err, 'providerHandler: User.findOne error');
              return done(e);
            }

            if (existingUser) {
              var e = new VError('email-in-use');
              return done(e);
            }

            UserModel.create(user, function (err, user) {
              if (err) {
                var e = new VError(err, 'providerHandler: User.create error');
                return done(e);
              }

              // create a UserIdentity for the user

              identity = {
                provider: 'google',
                externalId: profile.id,
                credentials: {
                  token: token,
                  secret: tokenSecret
                },
                profile: profile,
                userId: user.id
              };

              server.models.UserIdentity.create(identity, function (err, identity) {

                if (err) {
                  var e = new VError(err, 'providerHandler: UserIdentity.create error');
                  return done(e);
                }

                done(null, user);
              });
            });
          });
        }
      }
    });
  }

  // extract values from passport profile
  function profileToUser(profile, user) {

    if (_.has(profile, 'emails[0].value')) {
      user.email = _.get(profile, 'emails[0].value');
    }

    if (!user.firstName) {
      if (_.get(profile, 'name.givenName')) {
        user.firstName = profile.name.givenName;
      }
      if (_.get(profile, 'name.middleName')) {
        user.firstName += ' ' + profile.name.middleName;
      }
    }

    if (!user.lastName) {
      if (_.get(profile, 'name.familyName')) {
        user.lastName = profile.name.familyName;
      }
    }

    return user;
  }

};
