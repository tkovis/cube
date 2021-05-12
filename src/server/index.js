const letThereBePlayers = (world) => {
  const { app, server } = require("./server");
  const io = require("./io")({ server, world });

  world.resources.server = server;
  world.resources.io = io;
  world.resources.app = app;

  return { app, server, io };
};

const PORT = 3000;
const letThereBeLight = require("./init");
const ecs = require("./ecs");
const { performance } = require("perf_hooks");

const world = letThereBeLight();
const { app, server, io } = letThereBePlayers(world);
server.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
ecs.run(world, performance.now());
