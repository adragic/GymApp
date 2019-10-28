var mongoose = require('mongoose');

var gymSchema = new mongoose.Schema({
  clanovi: Number,
  clanarine: Number,  
  kapacitet: Number,
  trenutno: Number // trenutni broj korisnika u teretani
});
mongoose.model('Gym', gymSchema);