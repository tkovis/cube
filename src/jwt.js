import jwt from "jsonwebtoken";
import random from "./random";

const accessTokenSecret = random.hex(40);
const refreshTokenSecret = random.hex(40);

const sign = (payload, secret, options) =>
  new Promise((resolve, reject) =>
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) return reject(err);
      resolve(token);
    })
  );

export const signAccessToken = (payload) =>
  sign(payload, accessTokenSecret, { expiresIn: "1min" });

export const signRefreshToken = (payload) =>
  sign(payload, refreshTokenSecret, { expiresIn: "1d" });

const verify = (token, secret) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    })
  );

export const verifyAccessToken = (payload) =>
  verify(payload, accessTokenSecret);

export const verifyRefreshToken = (payload) =>
  verify(payload, refreshTokenSecret);
