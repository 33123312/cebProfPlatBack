const express = require("express") 
const passport = require('passport');
const jwt = require("jsonwebtoken")
const route = express.Router();

route.post(
    '/login',
    async (req, res, next) => {
      passport.authenticate(
        'login',
        async (err, user, info) => {
          if (err) return next(err);

          try {
            req.login(
              user,
              { session: false },
              async (error) => {
                if (error) return next(error);

                const token = generateToken(user.user)
                res.json({ token });
              });

          } catch (error) {
            return next(error);
          }
        })(req, res, next);
    }
  );


function generateToken(aluId){
    return jwt.sign({ user: aluId }, process.env.JWT_SECRET, { expiresIn: 60*60*24});
}

module.exports = route;