import mongoose from "mongoose";
import { userInfo } from "os";

const postSchema = new mongoose.Schema(
  {
    caption: { type: String, required: true },
    photo: { type: String, required: true, default: "no photo" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        text: String,
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
