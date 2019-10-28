var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

const { ensureAuthenticated } = require('../config/auth');

//Any requests to this controller must pass through this 'use' function
//Copy and pasted from method-override
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}));

const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

//Users index - get all users
router.route('/')
  .get(ensureAuthenticated, function (req, res, next) {
    if(req.user.role == "Admin"){
      mongoose.model('User').find({role:"User"}, function(err, users){
        if(err){
          console.log(err);
        }
        else {
          mongoose.model('Membership').find({}, function(err,memberships){
            if(err){
              return console.log(err);
            }
            else{
              res.render('users/index', {
              title: 'Članovi',
              user_role: req.user.role,
              username: req.user.name,
              users: users,
              memberships: memberships
              });
            }
          })
        }
      });
    }
    else{
      res.redirect('/memberships');
    }
});

//Users - login
router.route('/login')
  .get(function (req, res, next) {
    if(req.user==null)
      res.render('users/login', {
        title: "Prijava" ,
        logged: false
      });
    else
      res.redirect('/memberships');
  })
  .post(function(req, res, next){
    passport.authenticate('local', {
      successRedirect: '/memberships',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next);
  });

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
  //find the ID in the Database
  mongoose.model('User').findById(id, function (err, user) {
      //if it isn't found, we are going to repond with 404
      if (err) {
          console.log(id + ' was not found');
          res.status(404)
          var err = new Error('Not Found');
          err.status = 404;
          res.format({
              html: function () {
                  next(err);
              },
              json: function () {
                  res.json({ message: err.status + ' ' + err });
              }
          });
          //if it is found we continue on
      } else {
          //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
          //console.log(membership);
          // once validation is done save the new item in the req
          req.id = id;
          // go to the next thing
          next();
      }
  });
});

router.route('/user')
  .get(ensureAuthenticated, function(req,res,next){
    if(req.user.role == 'User'){
      res.redirect('/users/user/'+req.user._id+'/');
    }
    else{
      res.redirect('/users');
    }
  })

// Prikaz profila korisnika - spol, dob...
router.route('/user/:id')
  .get(ensureAuthenticated, function(req, res, next){
    if(req.user.role == "User"){
    mongoose.model('User').findById(req.id, function(err,user){
      if(err){
        console.log(err);
      }
      else{
        res.format({
          html: function () {
              res.render('users/show', {
                  title: user.name,
                  user: user
              });
          },
          json: function () {
              res.json(user);
          }
      });
      }
    })
    }
    // Admin ne može vidjeti profil - spol, dob...
    else {
      res.redirect('/users/');
    }
  });

// Uredi osnovne podatke korisnika
router.route('/user/:id/edit')
  .get(ensureAuthenticated, function(req,res,next){
    mongoose.model('User').findById(req.id, function(err, user){
      if(err){
        console.log(err);
      }
      else {
        res.render('users/edit', {
          title: user.name,
          user_role: req.user.role,
          user: user
        });
      }
    })
  })
  .put(function(req,res){
    var name = req.body.name;
    var email = req.body.email;
    var spol = req.body.spol;
    var dob = req.body.dob;

    mongoose.model('User').findById(req.id, function(err, user){
      user.update({
        name: name,
        email: email,
        spol: spol,
        dob: dob
      }, function(err, userID){
        if(err){
          res.send("There was a problem updating the information to the database: " + err);
        }
        else{
          res.redirect('/users/');
        }
      });
    });
  });

// Prikaz clanarina korisnika
router.route('/user/:id/memberships')
  .get(ensureAuthenticated, function(req, res, next){
    mongoose.model('Membership').find({
      korisnik: req.id
    }, function (err, memberships) {
        if (err) {
            return console.error(err);
        } else {
            mongoose.model('User').findById(req.id, function (err, user) {
              if (err) {
                return console.error(err);
              }
              else {
              if(req.user.role =="Admin"){
                res.render('memberships/index', {
                  title: 'Članarine',
                  user_role: req.user.role,
                  username: req.user.name,
                  users: [user],
                  memberships: memberships
                });
              }
              else {
                res.render('users/user_memberships', {
                  title: 'Moje članarine',
                  username: req.user.name,
                  user: user,
                  memberships: memberships
                });
              }
            }
          });
        }
    });
  });

//Users - register
router.route('/register')
  .get(function (req, res, next) {
    if(req.user==null)
      res.render('users/register', { 
        logged: false
      });
    else
      if(req.user.role == "User"){
        res.redirect('/memberships');
      }
      else{
        res.render('users/register', {
          title: "Registracija",
          logged: true,
          user_role: req.user.role
        });
      }
  })
  .post(function(req, res){
    var name = req.body.name;
    var email = req.body.email;
    var pass = req.body.password;
    var pass2 = req.body.confirmPassword;
    let errors = [];

    //Validation
    if(!name || !email || !pass || !pass2)
      errors.push({msg:'Potrebno je ispuniti sva polja!'});
    if(pass!==pass2)
      errors.push({msg: 'Unesene lozinke se ne podudaraju'});
    if(pass.length < 6)
      errors.push({msg: 'Lozinka treba sadržavati najmanje 6 znakova!'});

    //Check errors
    if(errors.length>0){
      res.render('users/register', {errors, name, email});
    }
    else{
      //Register user
      User.findOne({email: email})
        .then(user => {
          if(user){
            errors.push({msg: 'Uneseni korisnik ('+ email +') je već registriran!'});
            res.render('users/register', {errors, name, email});
          }
          else{ //Save user to db
            var newUser = new User({
              name: name,
              email: email,
              password: pass
            });
            
            //hash the password
            bcrypt.genSalt(10, (err, salt)=> 
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;
                newUser.password = hash;
                newUser.save()
                  .then(user => {
                    req.flash('success_msg', 'Uspješna registracija! Prijava je sada moguća!')
                    res.redirect('login');
                  })
                  .catch(err => console.log(err));
              }))
          }
        })
    }
  });

router.route('/logout')
  .get(function(req, res, next){
    req.logout();
    req.flash('success_msg', 'Uspješna odjava!');
    res.redirect('/users/login');
  });

module.exports = router;
