import * as worldHandlers from "./world.js";
import { playerComponents } from "./components.js";
import ecs from "./ecs.js";

const setupSocket = (world) => {
  const URL = "http://localhost:3000";
  const socket = io(URL, { autoConnect: false });

  socket.on("entities", (entities) => {
    for (const [eid, components] of Object.entries(entities)) {
      worldHandlers.onNewEntity(world, eid, components);
    }
  });

  socket.on("player spawned", ({ eid, components }) => {
    socket.eid = eid;
    worldHandlers.onNewEntity(world, eid, {
      ...components,
      ...playerComponents(world),
    });
  });

  socket.on("new player", ({ eid, components }) => {
    worldHandlers.onNewEntity(world, eid, components);
  });

  socket.on("player left", ({ eid }) => {
    ecs.addComponents(world, eid, { kill: true });
  });

  socket.on("tick", (meshes) => {
    const time = 100;
    for (const [eid, mesh] of Object.entries(meshes)) {
      if (eid !== socket.eid) {
        ecs.appendToComponent(world, eid, "meshUpdates", { mesh, time });
      }
    }
  });

  socket.auth = { username: Math.random().toString().slice(-8) };
  socket.connect();

  window.addEventListener("beforeunload", () => socket.disconnect());

  world.resources.socket = socket;
};

export default setupSocket;
