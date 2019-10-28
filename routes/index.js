var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST

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
}))

/* GET home page. */
router.route('/')
  .get(function(req, res, next) {
    console.log(req.user);
    mongoose.model('Gym').findOne(function(err, gym){
      if(err){
        return console.log(err);
      }
      else{
        if(req.user != null){
          res.render('index', { 
            title: 'Teretana',
            gym: gym,
            user_role: req.user.role,
            logged: true
          });
        }
        else{
          res.render('index', { 
            title: 'Teretana',
            gym: gym,
            logged: false
          });
        }
      }
    });
    
}).post(function(req,res){
  var trenutno = req.body.trenutno;
  var kapacitet = req.body.kapacitet;
  var clanovi = req.body.clanovi;
  var clanarine = req.body.clanarine;

  mongoose.model('Gym').create({
    trenutno: trenutno,
    kapacitet: kapacitet,
    clanovi: clanovi,
    clanarine: clanarine
  }, function(err, gym){
    if(err){
      return console.log(err);
    }
    else{
      res.redirect('/');
    }
  });
}).put(function(req,res){
  var trenutno = req.body.trenutno;
  var kapacitet = req.body.kapacitet;
  var clanovi = req.body.clanovi;
  var clanarine = req.body.clanarine;
  mongoose.model('Gym').findOne(function(err, gym){
    if(err){
      return console.log(err);
    }
    else{
      gym.update({
        trenutno: trenutno,
        kapacitet: kapacitet,
        clanovi: clanovi,
        clanarine: clanarine
      }, function(err, gymID){
        if(err){
          return console.log(err);
        }
        else{
          res.redirect('/');
        }
      })
    }
  });

});

/* GET Admin Gym Settings page. */
router.route('/settings')
  .get(function(req, res, next) {
    if(req.user != null){
      mongoose.model('Gym').findOne(function(err, gym){
        if(err){
          return console.log(err);
        }
        else{
          res.render('settings', { 
            title: 'Teretana',
            user_role: req.user.role,
            logged: true,
            gym: gym
          });
        }
      });
    }
    else{
      res.render('index', { 
        title: 'Teretana',
        logged: false
      });
  }
});

module.exports = router;
