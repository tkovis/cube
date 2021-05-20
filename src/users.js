import db from "./db";
import pw from "./password";

const get = (username) => db.get(`users.${username}`);

const put = async (username, password) => {
  const hashedPassword = await pw.hash(password);
  return db.put(`users.${username}`, hashedPassword);
};

const isValidPassword = (password, hashedPassword) =>
  pw.compare(password, hashedPassword);

const strongPassword = pw.strongPassword;

export default { get, put, isValidPassword, strongPassword };
