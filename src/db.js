import level from "level-rocksdb";

const db = level("./mydb");

const put = (k, v) =>
  new Promise((resolve, reject) => {
    db.put(k, JSON.stringify(v), function (err) {
      if (err) return reject(err);
      resolve();
    });
  });

const get = (k) =>
  new Promise((resolve, reject) => {
    db.get(k, function (err, value) {
      const notFoundError = err?.message.includes("Key not found in database");
      if (notFoundError) {
        return resolve(null);
      } else if (!notFoundError && err) {
        console.log(!notFoundError, err);
        return reject(err);
      }
      resolve(JSON.parse(value));
    });
  });

export default {
  put,
  get,
};
