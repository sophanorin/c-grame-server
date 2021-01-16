import express from "express";
import expressAsyncHandler from "express-async-handler";
import expressasynchandler from "express-async-handler";
import Post from "../models/postModels.js";
import User from "../models/userModels.js";
import { isAuth } from "../utils.js";

const postRouter = express.Router();

postRouter.get("/", (req, res) => {
  res.send("Hello World");
});

postRouter.get(
  "/allpost",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    Post.find({})
      .populate("postedBy", "name pic")
      .populate("comments.commentedBy", "name")
      .sort("-createdAt")
      .then((posts) => res.send(posts))
      .catch((err) => res.status(501).send({ message: err }));
  })
);

postRouter.get(
  "/mypost",
  isAuth,
  expressasynchandler(async (req, res) => {
    Post.find({ postedBy: req.user._id })
      .then((posts) => res.send(posts))
      .catch((err) => res.status(404).send({ message: err }));
  })
);

postRouter.post(
  "/createpost",
  isAuth,
  expressasynchandler(async (req, res) => {
    const { caption, url } = req.body;
    if (!caption || !url)
      return res.status(401).send({ message: "Please!! add all the fields" });

    const post = new Post({
      caption,
      photo: url,
      postedBy: req.user._id,
    });
    console.log(post);
    const posted = await post.save();
    res.send({ message: "posted", data: posted });
  })
);

postRouter.put(
  "/like",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { likes: req.user._id } },
      { new: true }
    )
      .populate("postedBy", "name")
      .exec((err, doc) => {
        if (err) return res.status(422).send({ message: err });
        else {
          return res.send(doc);
        }
      });
  })
);

postRouter.put(
  "/unlike",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { likes: req.user._id } },
      { new: true }
    )
      .populate("postedBy", "name")
      .exec((err, doc) => {
        if (err) return res.status(422).send({ message: err });
        else {
          return res.send(doc);
        }
      });
  })
);

postRouter.put(
  "/comments",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { comments: { text: req.body.text, commentedBy: req.user._id } },
      },
      { new: true }
    )
      .populate("comments.commentedBy", "name")
      .exec((err, doc) => {
        if (err) return res.status(422).send({ message: err });
        else {
          return res.send(doc);
        }
      });
  })
);

postRouter.delete(
  "/delete/:id",
  expressAsyncHandler(async (req, res) => {
    Post.findOne({ _id: req.params.id }).exec((err, doc) => {
      if (err) res.status(422).send({ message: err });
      else
        doc
          .remove()
          .then((data) => res.send(doc))
          .catch((err) => console.log(err));
    });
  })
);

export default postRouter;
