const middleware = require("./middleware.js");

const setup = ({ server, world }) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(middleware.auth);

  const handlers = require("./socketHandlers")({ io, world });

  for (const [event, handler] of handlers) {
    io.on(event, handler);
  }
};

module.exports = setup;
