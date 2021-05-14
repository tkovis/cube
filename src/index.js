import { init } from "./world";
import ecs from "./ecs";
import { performance } from "perf_hooks";
import { app, server } from "./server";
import ioSetup from "./io";

const letThereBePlayers = (world) => {
  const io = ioSetup({ server, world });

  world.resources.server = server;
  world.resources.io = io;
  world.resources.app = app;

  server.listen(PORT, () =>
    console.log(`Server listening on http://localhost:${PORT}`)
  );
  ecs.run(world, performance.now());
};

const PORT = process.env.PORT || 3000;

const world = init();
letThereBePlayers(world);
