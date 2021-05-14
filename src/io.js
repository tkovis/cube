import middleware from "./middleware.js";
import setupHandlers from "./socket.js";
import socketIo from "socket.io";

export default ({ server, world }) => {
  const io = socketIo(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(middleware.auth);

  const handlers = setupHandlers({ io, world });

  for (const [event, handler] of handlers) {
    io.on(event, handler);
  }
};
