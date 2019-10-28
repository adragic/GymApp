var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
  role: { type: String, enum: ["User","Admin"], default: "User"},
  spol: { type: String, enum: ["M","F"] },
  dob: Number
});

mongoose.model('User',userSchema);