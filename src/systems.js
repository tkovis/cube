import { performance } from "perf_hooks";
import constants from "./shared/constants.json";
import db from "./db";

const { tickRate } = constants;

export const updateSystem = () => {
  let tickTimer = performance.now();
  return {
    name: "updateSystem",
    execute: (world, deltaTime) => {
      tickTimer += deltaTime;
      if (tickTimer < tickRate) {
        return;
      }
      const updatedMeshes = {};
      for (const [eid, mesh] of world.components.mesh) {
        if (mesh.dirty) {
          updatedMeshes[eid] = mesh;
          mesh.dirty = false;

          const { position, quaternion } = mesh;
          db.put(`entities.${eid}.mesh`, { position, quaternion });
        }
      }
      world.components.socket.forEach((socket) => {
        if (Object.keys(updatedMeshes).length) {
          socket.emit("tick", updatedMeshes);
        }
      });
      tickTimer = 0;
    },
  };
};

export const debugSystem = () => {
  let updates = 0;
  let t1 = performance.now();
  let timeElapsed = 0;
  return {
    name: "debugSystem",
    execute: () => {
      updates++;
      const t2 = performance.now();
      timeElapsed += t2 - t1;
      t1 = t2;
      if (timeElapsed > 1000) {
        const ups = updates / (timeElapsed * 0.001);
        console.log("ups", Math.round(ups));
        updates = 0;
        timeElapsed = 0;
      }
    },
  };
};
