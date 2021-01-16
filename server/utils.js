import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";

export const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET || "somethingsecret",
    { expiresIn: "30d" }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length);
    jwt.verify(
      token,
      process.env.JWT_SECRET || "somethingsecret",
      (err, decode) => {
        if (err) res.status(401).send({ message: "Invalid token" });
        else {
          req.user = decode;
          next();
        }
      }
    );
  } else res.status(401).send({ message: "No token" });
};
