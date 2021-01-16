import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRouter from "./routers/userRouter.js";
import postRouter from "./routers/postRouter.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(
    process.env.CONNECTION_STRING || "mongodb://localhost/instagram-clone",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
  .then(() => console.log("MongoBD connected..."))
  .catch((err) => console.log(err));

//router......
app.use("/api/users", userRouter);
app.use("/api/post", postRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});
app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});
