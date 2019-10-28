var mongoose = require('mongoose');

var memebershipSchema = new mongoose.Schema({  
  korisnik: String,
  kategorija: String, // obična, studentska..
  vrsta: String, // mjesečna, godišnja...
  opis: String, // 2xtjedno, 3xtjedno, grupni, individualni
  cijena: Number,
  datum_uplate: { type: Date, default: Date.now },
  datum_pocetka: { type: Date, default: Date.now},
  datum_isteka: { type: Date, default: Date.now },
  status: String, // aktivna, istekla, zamrznuta
});
mongoose.model('Membership', memebershipSchema);