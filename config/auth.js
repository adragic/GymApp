module.exports = {
    ensureAuthenticated: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_msg', 'Potrebna je prijava!');
        res.redirect('/users/login');
    }
}