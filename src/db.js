import level from "level-rocksdb";
import beforeShutdown from "./beforeShutdown";

const db = level("./mydb");

beforeShutdown(() => db.close());

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
      if (err) {
        if (err.type === "NotFoundError") {
          return resolve(null);
        }
        return reject(err);
      }
      resolve(JSON.parse(value));
    });
  });

export default {
  put,
  get,
};
