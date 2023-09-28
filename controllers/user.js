const bcrypt = require("bcryptjs");
const User = require("../models/user");
const image = require("../utils/image");

async function getMe(req, res) {
  const { user_id } = req.user;

  const response = await User.findById(user_id);

  if (!response) {
    res.status(400).send({ msg: "No se ha encontrado usuario" });
  } else {
    res.status(200).send(response);
  }
}

async function getUsers(req, res) {
  const { active } = req.query;
  let response = null;

  if (active === undefined) {
    response = await User.find();
  } else {
    response = await User.find({ active });
  }

  res.status(200).send(response);
}

async function createUser(req, res) {
  console.log(req.files,"req files");
  console.log(req.body, "req body");
  const { password } = req.body;
  let user = new User({ ...req.body, active: false });

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  user.password = hashPassword;

  if (req.files && req.files.fileAvatar) {
    const imagePath = image.getFilePath(req.files.fileAvatar);
    console.log(imagePath, ">>>>>>ImagePAth");
    user.avatar = imagePath;
  }
  console.log(user, "USUARIO!");
  user.save((error, userStored) => {
    if (error) {
      res.status(400).send({ msg: "Error al crear el usuario" });
    } else {
      res.status(201).send(userStored);
    }
  });
}

async function updateUser(req, res) {
  console.log("<<<U/U REQ FILES>>>",req.files);
  console.log("<<<U/U REQ BODY>>>",req.body);
  const { id } = req.params;
  let userData = req.body;

  if (userData.password) {
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(userData.password, salt);
    userData.password = hashPassword;
  } else {
    delete userData.password;
  }

  if (req.files.fileAvatar) {
    const imagePath = image.getFilePath(req.files.fileAvatar);
    userData.avatar = imagePath;
  }
  console.log("U/U USUARIO!", userData);
  User.findByIdAndUpdate({ _id: id }, userData, (error) => {
    if (error) {
      res.status(400).send({ msg: "Error al actualizar el usuario" });
    } else {
      res.status(200).send({ msg: "Actualizacion correcta" });
    }
  });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  console.log(">>>REQ PARAMS",req.params);
  User.findByIdAndDelete(id, (error) => {
    if (error) {
      res.status(400).send({ msg: "Error al eliminar el usuario" });
    } else {
      res.status(200).send({ msg: "Usuario eliminado" });
    }
  });
}

module.exports = {
  getMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
