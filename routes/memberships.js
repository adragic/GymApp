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
}))

// REST operations for memberships route
router.route('/')
    //GET all memberships
    .get(ensureAuthenticated, function (req, res, next) {
        //for admin - all memberships
        if(req.user.role == "Admin"){
            mongoose.model('Membership').find({}, function (err, memberships) {
                if (err) {
                    return console.error(err);
                } else {
                    mongoose.model("User").find({}, function(err2, users) {
                        if (err2){
                            return console.error(err2);
                        }
                        else{
                            //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                            res.format({
                                //HTML response will render the index.jade file in the views/memberships folder. We are also setting "memberships" to be an accessible variable in our jade view
                                html: function () {
                                    res.render('memberships/index', {
                                        title: 'Sve članarine',
                                        user_role: req.user.role,
                                        memberships: memberships,
                                        username: req.user.name,
                                        users: users
                                    });
                                },
                                //JSON response will show all memberships in JSON format
                                json: function () {
                                    res.json(memberships);
                                }
                            });
                        }
                    });
                }
            });
        }
        // for regular user, membership owner
        else {
            res.redirect('users/user/' + req.user._id + '/memberships');
        }

    })
    //POST a new membership
    .post(function (req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var email = req.body.email;

        mongoose.model('User').findOne({email: req.body.email}).then(user =>{
            // Postoji korisnik (član)
            if(user){
                var korisnik = user._id;
                var kategorija = req.body.kategorija;
                var vrsta = req.body.vrsta;
                var opis = req.body.opis;
                var cijena = req.body.cijena;
                var datum_uplate = req.body.datum_uplate;
                var datum_pocetka = req.body.datum_pocetka;
                var datum_isteka = req.body.datum_isteka;
                var status = req.body.status;
        
                //call the create function for our database
                mongoose.model('Membership').create({
                    korisnik: korisnik,
                    kategorija: kategorija,
                    vrsta: vrsta,
                    opis: opis,
                    cijena: cijena,
                    datum_uplate: datum_uplate,
                    datum_pocetka: datum_pocetka,
                    datum_isteka: datum_isteka,
                    status: status
                }, function (err, membership) {
                    if (err) {
                        res.send(err);
                    } else {
                        //Membership has been created
                        console.log('POST creating new membership: ' + membership);
                        res.format({
                            //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                            html: function () {
                                // If it worked, set the header so the address bar doesn't still say /adduser
                                res.location("memberships");
                                // And forward to success page
                                res.redirect("/memberships");
                            },
                            //JSON response will show the newly created membership
                            json: function () {
                                res.json(membership);
                            }
                        });
                    }
                });
            }
            // Ne postoji član i potrebno ga je prvo registrirati
            else{
                var error_user_msg = "Uneseni korisnik (" + email + ") ne postoji i potrebno ga je prvo registrirati!";
                res.render('memberships/new', {error_user_msg, email});
            }
        })

    });

/* GET New membership page. */
router.get('/new', ensureAuthenticated, function (req, res) {
    if(req.user.role == "Admin"){
        res.render('memberships/new', { 
            title: 'Dodaj novu članarinu',
            email: req.query.email,
            user_role: req.user.role 
        });
    }
    else{
        res.redirect('memberships');
    }
});

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Membership').findById(id, function (err, membership) {
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

router.route('/:id/edit')
    //GET the individual membership by Mongo ID
    .get(ensureAuthenticated, function (req, res) {
        //search for the membership within Mongo
        if(req.user.role == "Admin"){
            mongoose.model('Membership').findById(req.id, function (err, membership) {
                if (err) {
                    console.log('GET Error: There was a problem retrieving: ' + err);
                } else {
                    mongoose.model('User').findById(membership.korisnik, function(err, user){
                        if(err){
                            console.log(err);
                        }
                        else {
                            //Return the membership
                            console.log('GET Retrieving ID: ' + membership._id);
                            res.format({
                                //HTML response will render the 'edit.jade' template
                                html: function () {
                                    res.render('memberships/edit', {
                                        membership: membership,
                                        user_role: req.user.role,
                                        user: user
                                    });
                                },
                                //JSON response will return the JSON output
                                json: function () {
                                    res.json(membership);
                                }
                            });
                        }

                    });
                }
            });
        }
        else {
            res.redirect('/memberships');
        }
    })
    //PUT to update a membership by ID
    .put(function (req, res) {
        // Get our REST or form values. These rely on the "naziv" attributes
        var korisnik = req.user._id;
        var kategorija = req.body.kategorija;
        var vrsta = req.body.vrsta;
        var opis = req.body.opis;
        var cijena = req.body.cijena;
        var datum_uplate = req.body.datum_uplate;
        var datum_pocetka = req.body.datum_pocetka;
        var datum_isteka = req.body.datum_isteka;
        var status = req.body.status;

        //find the document by ID
        mongoose.model('Membership').findById(req.id, function (err, membership) {
            //update it
            membership.update({
                kategorija: kategorija,
                vrsta: vrsta,
                opis: opis,
                cijena: cijena,
                datum_uplate: datum_uplate,
                datum_pocetka: datum_pocetka,
                datum_isteka: datum_isteka,
                status: status
            }, function (err, membershipID) {
                if (err) {
                    res.send("There was a problem updating the information to the database: " + err);
                }
                else {
                    //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                    res.format({
                        html: function () {
                            res.redirect("/memberships/");
                        },
                        //JSON responds showing the updated values
                        json: function () {
                            res.json(membership);
                        }
                    });
                }
            })
        });
    })
    //DELETE a membership by ID
    .delete(function (req, res) {
        //find Membership by ID
        mongoose.model('Membership').findById(req.id, function (err, membership) {
            if (err) {
                return console.error(err);
            } else {
                //remove it from Mongo
                membership.remove(function (err, membership) {
                    if (err) {
                        return console.error(err);
                    } else {
                        //Returning success messages saying it was deleted
                        console.log('DELETE removing ID: ' + membership._id);
                        res.format({
                            //HTML returns us back to the main page, or you can create a success page
                            html: function () {
                                res.redirect("/memberships");
                            },
                            //JSON returns the item with the message that is has been deleted
                            json: function () {
                                res.json({
                                    message: 'deleted',
                                    item: membership
                                });
                            }
                        });
                    }
                });
            }
        });
    });

module.exports = router;