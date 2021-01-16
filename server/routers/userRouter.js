import express from "express";
import expressAsyncHandler from "express-async-handler";
import User from "../models/userModels.js";
import Post from "../models/postModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateToken, isAuth, transporter } from "../utils.js";

const userRouter = express.Router();

userRouter.post(
  "/query/:q?",
  expressAsyncHandler(async (req, res) => {
    let pattern = new RegExp("^" + req.params.q + "");
    console.log(pattern);
    await User.find({ name: { $regex: pattern } })
      .then((users) => {
        console.log(users);
        res.send(users);
      })
      .catch((err) => res.send(err));
  })
);

// userRouter.post(
//   "/search/:q?",
//   expressAsyncHandler(async (req, res) => {
//     // error
//     console.log(q);
//     console.log(req.body.query);
//     // let pattern = new RegExp("^" + req.params.q);
//     // await User.find({ email: { $regex: pattern } })
//     //   .then((users) => {
//     //     res.send(users);
//     //   })
//     //   .catch((err) => res.send(err));
//   })
// );

userRouter.get(
  "/checkToken/:token?",
  expressAsyncHandler(async (req, res) => {
    console.log(req.params.token);
    User.findOne({ resetToken: req.params.token }).exec((err, doc) => {
      if (err) {
        res.status(422).send({ error: err });
      } else {
        const date = new Date(doc.expireToken);
        console.log(date.getTime());
        console.log(Date.now());
        if (date.getTime() - Date.now() > 0) {
          console.log("not expire yet");
          res.send({ expire: false });
        } else {
          console.log("expired");
          res.send({ expire: true });
        }
      }
    });
  })
);

userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user.id,
          name: user.name,
          email: user.email,
          followers: user.followers,
          following: user.following,
          pic: user.pic,
          resetToken: user.resetToken,
          expireToken: user.expireToken,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: "The username or password is incorrect" });
  })
);

userRouter.post(
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

        transporter
          .sendMail({
            from: "instaclone293@gmail.com",
            to: createdUsers.email,
            subject: "Account Created",
            html:
              "<h1 style={text-align: center}>Welcome To Instagram Clone</h1>",
          })
          .then((info) => {
            console.log(info);
          });

        res.send({
          _id: createdUsers.id,
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

userRouter.get(
  "/reset-password/:email?",
  expressAsyncHandler(async (req, res) => {
    console.log(req.params.email);

    crypto.randomBytes(256, async (err, buf) => {
      if (err) console.log(err);

      const token = buf.toString("hex");

      const user = await User.findOne({ email: req.params.email });

      if (!user)
        return res.status(422).send({ error: "Your email doesn't existing" });

      user.resetToken = token;
      user.expireToken = Date.now() + 300000;

      user.save().then((next) => {
        transporter.sendMail({
          from: "instaclone293@gmail.com",
          to: user.email,
          subject: "reset-password",
          html: `
              <p>You requested for password reset</p>
              <h5>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset password</h5>
            `,
        });
        console.log("sent mail");
        res.send({ message: "Check your email" });
      });
    });
  })
);

userRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    User.findOne({ _id: req.params.id })
      .select("-password")
      .then((user) => {
        Post.find({ postedBy: req.params.id }).exec((error, posts) => {
          if (error) return res.status(422).send({ error });
          else return res.send({ user, posts });
        });
      });
  })
);

userRouter.put(
  "/follow",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { following: req.body.followerId },
      },
      { new: true }
    ).exec((err, following) => {
      if (err) return res.status(422).send({ error: message });

      User.findByIdAndUpdate(
        req.body.followerId,
        {
          $push: { followers: req.user._id },
        },
        { new: true }
      ).exec((err, followers) => {
        if (err) res.status(422).send({ error: err });
        else res.send({ following, followers });
      });
    });
  })
);

userRouter.put(
  "/unfollow",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body.followerId },
      },
      { new: true }
    ).exec((err, following) => {
      if (err) return res.status(422).send({ error: message });

      User.findByIdAndUpdate(
        req.body.followerId,
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      ).exec((err, followers) => {
        if (err) res.status(422).send({ error: err });
        else res.send({ following, followers });
      });
    });
  })
);

userRouter.put(
  "/update",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
      req.user._id,
      {
        // name: req.body.name,
        // email: req.body.email,
        // password: bcrypt.hashSync(req.body.password, 8),
        pic: req.body.pic,
      },
      { new: true }
    )
      .select("-password")
      .exec((err, doc) => {
        if (err) res.status(422).send({ error: err });
        else res.send(doc);
      });
  })
);

userRouter.put(
  "/update-password",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ resetToken: req.body.token });

    user.password = bcrypt.hashSync(req.body.password, 8);

    user
      .save()
      .then((doc) => {
        doc.password = undefined;
        res.send({ message: "Password Updated", user: doc });
      })
      .catch((err) => {
        res.status(422).send({ error: err });
      });
  })
);

export default userRouter;
