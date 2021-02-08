import express from "express";
import expressAsyncHandler from "express-async-handler";
import User from "../models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSimpleRouter = express.Router();

userSimpleRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    res.send("Simple user");
  })
);

userSimpleRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ name: req.body.name });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
        });
        return;
      }
    }
    res.status(401).send({ message: "The username or password is incorrect" });
  })
);

userSimpleRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    await user
      .save()
      .then((createdUsers) => {
        console.log(createdUsers);
        res.send({
          _id: createdUsers._id,
          name: createdUsers.name,
          email: createdUsers.email,
          token: generateToken(user),
        });
      })
      .catch((err) => {
        res.status(422).send({ message: err });
      });
  })
);

export default userSimpleRouter;
