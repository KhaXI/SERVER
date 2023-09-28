const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  role: String,
  active: {
    type: Boolean,
    default: false
  },
  avatar: String,
  jwt: String,
  attemp: {
    type: Number,
    default: 0
  },
});

module.exports = mongoose.model("User", UserSchema);
