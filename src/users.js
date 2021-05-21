import { v4 as uuidv4 } from "uuid";
import db from "./db";
import pw from "./password";

const getPassword = (username) => db.get(`users.${username}.password`);

const putPassword = async (username, password) => {
  const hashedPassword = await pw.hash(password);
  return db.put(`users.${username}.password`, hashedPassword);
};

const getId = (username) => db.get(`users.${username}.id`);

const putId = (username, id = uuidv4()) => db.put(`users.${username}.id`, id);

const isValidPassword = (password, hashedPassword) =>
  pw.compare(password, hashedPassword);

const strongPassword = pw.strongPassword;

export default {
  getPassword,
  putPassword,
  getId,
  putId,
  isValidPassword,
  strongPassword,
};
