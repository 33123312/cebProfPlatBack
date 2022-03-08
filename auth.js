const passport = require('passport')
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs')
const connection = require("./utilityes/DbConection")
require('mysql2')

passport.use(
    'login',
    new localStrategy(
      {
        usernameField: 'user',
        passwordField: 'password'
      },
      async (user, password, done) => {
        connection((err, connection) => {
            if (err) throw err; // not connected!
            
            let query = "select * from profesoresWebUsers where clave_profesor = '" + user +"'"
            //console.log(query)
            connection.query(query, (error, results, fields) => {
              //console.log(error,password,results[0].password)
                if(!error && results.length > 0 && bcrypt.compareSync(password,results[0].password))
                    return done(null, {user},"ok");
                else
                    return done("Usuario o contraseña incorrectos",false,"Usuario o contraseña incorrectos")
    
            })
        })   
      })
    );

    
  const JWTstrategy = require('passport-jwt').Strategy;
  const ExtractJWT = require('passport-jwt').ExtractJwt;
  
  passport.use(
    new JWTstrategy(
      {
        secretOrKey: process.env.JWT_SECRET,
        jwtFromRequest: ExtractJWT.fromHeader('x-acces-token')
      },
      async (token, done) => {
        //console.log(token)
        done(null, token);
      }
    )
  );

