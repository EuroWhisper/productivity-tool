const User = require('./db/user');
const secret = process.env.SECRET;

var passport = require('passport');

var JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;

var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['jwt'];
    }
    return token;
};

var opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = secret;

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    console.log('hello?');
  console.log(jwt_payload);
  User.findOne({_id: jwt_payload._id}, function(err, user) {
      if (err) {
          return done(err, false);
      }
      if (user) {
          return done(null, user);
      } else {
          return done(null, false);
          // or you could create a new account
      }
  });
}));

