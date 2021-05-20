import express from "express";
import path from "path";
import http from "http";
import bodyParser from "body-parser";
import users from "./users";

export const app = express();
app.use(express.static(path.join(__dirname, "/client")));
app.use(bodyParser.json());

app.post("/register", async ({ body: { username, password } }, res) => {
  if (!username || typeof username !== "string")
    return res.status(400).json({ error: "string username required" });
  if (username.length < 3)
    return res
      .status(400)
      .json({ error: "username has to be atleast 3 characters long" });
  if (!users.strongPassword(password))
    return res.status(400).json({
      error:
        "password didn't pass regex min length 8, 1 upper and lowercase letter, 1 number, 1 special character",
    });

  const existingUser = await users.get(username);
  if (existingUser) {
    return res.status(400).json({ error: "username exists" });
  }

  await users.put(username, password);

  return res.status(200).json({ message: "ok" });
});

app.post("/login", async ({ body: { username, password } }, res) => {
  if (!username || typeof username !== "string")
    return res.status(400).json({ error: "string username required" });
  if (!password || typeof password !== "string")
    return res.status(400).json({
      error: "string password required",
    });

  const hashedPassword = await users.get(username);
  if (!hashedPassword) {
    return res.status(400).json({ error: "user does not exist" });
  }

  if (await users.isValidPassword(password, hashedPassword)) {
    return res.status(200).json({ message: "ok" });
  }
  return res.status(400).json({ error: "invalid password" });
});

export const server = http.createServer(app);
