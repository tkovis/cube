import bcrypt from "bcrypt";
import { strongRegex } from "./shared/regex";
const saltRounds = 10;

/**
 * Hash a plaintext String. Resolves to a hashed password.
 *
 * @param password
 * @returns {Promise<unknown>}
 */
const hash = (password) =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (!err) return resolve(hash);
      reject(err);
    });
  });

/**
 * Compare a plaintext and hashed string. Resolves to true if they match and false otherwise.
 *
 * @param plainText
 * @param hashed
 * @returns {Promise<unknown>}
 */
const compare = (plainText, hashed) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(plainText, hashed, function (err, res) {
      if (err) return reject(err);
      if (res === true) return resolve(true);
      resolve(false);
    });
  });

/**
 * Test for a strong password. Return true for strong passwords and false otherwise.
 *
 * Requirements:
 * lower case letter
 * upper case letter
 * special character
 * 8 characters
 *
 * @param password
 * @returns {boolean}
 */
const strongPassword = (password) =>
  typeof password === "string" && strongRegex.test(password);

export default {
  hash,
  compare,
  strongPassword,
};
