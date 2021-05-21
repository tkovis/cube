import express from "express";
import path from "path";
import http from "http";
import bodyParser from "body-parser";
import users from "./users";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

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

  const existingUserId = await users.getId(username);
  if (existingUserId) {
    return res.status(400).json({ error: "username exists" });
  }

  await Promise.all([
    users.putPassword(username, password),
    users.putId(username),
  ]);

  return res.status(200).json({ message: "ok" });
});

app.post("/token", async ({ body: { username, password, token } }, res) => {
  if (token) {
    try {
      const decoded = await verifyRefreshToken(token);
      const payload = { username: decoded.username };
      if (decoded) {
        const [accessToken, refreshToken] = await Promise.all([
          signAccessToken(payload),
          signRefreshToken(payload),
        ]);
        return res
          .status(200)
          .json({ message: "ok", accessToken, refreshToken });
      }
    } catch (e) {
      return res.status(400).json({ error: "invalid token" });
    }
  }

  if (!username || typeof username !== "string")
    return res.status(400).json({ error: "string username required" });
  if (!password || typeof password !== "string")
    return res.status(400).json({
      error: "string password required",
    });

  const hashedPassword = await users.getPassword(username);
  if (!hashedPassword) {
    return res.status(400).json({ error: "user does not exist" });
  }

  if (await users.isValidPassword(password, hashedPassword)) {
    const payload = { username };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ]);
    return res.status(200).json({ message: "ok", accessToken, refreshToken });
  }
  return res.status(400).json({ error: "invalid password" });
});

export const server = http.createServer(app);
