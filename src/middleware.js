import { verifyAccessToken } from "./jwt";
import users from "./users";

export default {
  auth: async (socket, next) => {
    const accessToken = socket.handshake.auth.accessToken;
    if (!accessToken) {
      return next(new Error("missing accesstoken"));
    }
    try {
      const { username } = await verifyAccessToken(
        socket.handshake.auth.accessToken
      );
      const userId = await users.getId(username);
      socket.username = username;
      socket.userId = userId;
      next();
    } catch (e) {
      return next(new Error("invalid accesstoken"));
    }
  },
};
