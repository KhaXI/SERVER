const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("../utils/jwt");

function register(req, res) {
  const { firstname, lastname, email, password } = req.body;
  console.log(req.body);
  if (!email) {
    res.status(400).send({ msg: "El email es obligatorio" })
  } else if (!password) {
    res.status(400).send({ msg: "La contraseña es obligatoria" });
  } else {
    const user = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      role: "user",
      active: false,
    });
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    user.password = hashPassword;

    user.save((error, userStorage) => {
      if (error) {
        console.log(error, "error en base de datos");
        res.status(400).send({ msg: "Error al crear el usuario" });
      } else {
        res.status(200).send(userStorage);
      }
    });
  }
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email) res.status(400).send({ msg: "El email es obligatorio" });
  if (!password) res.status(400).send({ msg: "La contraseña es obligatoria" });

  const emailLowerCase = email.toLowerCase();

  User.findOne({ email: emailLowerCase, active: true }, (error, userStore) => {
    if (!userStore) {
      res.status(401).send({ msg: "Usuario no encontrado" })
    }else if (error) {
      res.status(500).send({ msg: "Error del servidor" });
    } else {
      bcrypt.compare(password, userStore.password, (bcryptError, check) => {
        if (bcryptError) {
          res.status(500).send({ msg: "Error del servidor" });
        }
        //MEJORAR RESPUESTA AL USUARIO 
        else if (userStore.attemp >= 3) {
          User.findByIdAndUpdate({ _id: userStore._id }, { active: false }, { new: true }).then(res => { console.log(res.active, "usuario Bloqueado") })
          res.status(404).send({ msg: "Usuario bloqueado" });
        } else if (!check) {
          //const actAtt = userStore.attemp + 1;
          User.findByIdAndUpdate({ _id: userStore._id }, { attemp: userStore.attemp + 1 }, { new: true }).then(res => { console.log(res.attemp, "<=attemp user C.incorrecta") })
          res.status(400).send({ msg: "Contraseña incorrecta" });
        } else if (!userStore.active) {
          res.status(401).send({ msg: "Usuario no autorizado o no activo" });
        }else {

          console.log("contraseña correcta");
          //CONTROL DE CONCURRENCIA
          User.findByIdAndUpdate({ _id: userStore._id }, { attemp: 0 }, { new: true }).then(res => { console.log(res.attemp, "<=attemp user C.correcta") })
          let generateToken = false

          if (userStore.jwt) {
            const payload = jwt.decoded(userStore.jwt);
            const { exp } = payload;
            const currentData = new Date().getTime();

            if (exp <= currentData) {//CORRECTO (VENCIDO)
              generateToken = true
            }
          } else {//CORRECTO (NULL)
            generateToken = true
          }

          console.log("generate token:", generateToken ? "si" : "no");
          if (generateToken === true) {
            const access = jwt.createAccessToken(userStore)
            const refresh = jwt.createRefreshToken(userStore)
            User.findByIdAndUpdate({ _id: userStore._id }, { jwt: access, }, { new: true }).then(res => { console.log(res, "<=Update user") })
            res.status(200).send({
              id: userStore._id,
              access: access,
              refresh: refresh
            })
          } else {
            res.status(401).send({ msg: "ya hay un usuario loggeado" })
          }
        }
      });
    }
  })
}

function refreshAccessToken(req, res) {
  const { token } = req.body;

  if (!token) res.status(400).send({ msg: "Token requerido" });

  const { user_id } = jwt.decoded(token);

  User.findOne({ _id: user_id }, (error, userStorage) => {
    if (error) {
      res.status(500).send({ msg: "Error del servidor" });
    } else {
      res.status(200).send({
        accessToken: jwt.createAccessToken(userStorage),
      });
    }
  });
}

async function logOut(req) {
  const { id } = req.params
  await User.findByIdAndUpdate({ _id: id }, { jwt: null }, { new: true })
  console.log("se ha cerrado cesion");
  return {
    data: { msg: "ok" },
    status: 200
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logOut
};
