import * as THREE from "three";
import ecs from "./ecs.js";

const keyCodes = {
  w: 87,
  a: 65,
  s: 83,
  d: 68,
};

export const killSystem = {
  name: "killSystem",
  execute: (world) => {
    for (const eid of world.components.kill.keys()) {
      const mesh = world.components.mesh.get(eid);
      if (mesh) {
        world.resources.scene.remove(mesh);
      }
      ecs.removeEntity(world, eid);
    }
  },
};

export const moveSystem = {
  name: "moveSystem",
  execute: (world, deltaTime, time) => {
    // set latest target from updates
    world.components.meshUpdates.forEach((updates, eid) => {
      if (!updates.length) {
        ecs.removeComponents(world, eid, ["meshUpdates"]);
      }
      updates.forEach((update) => {
        update.time -= deltaTime;
      });
      while (updates[0]?.time < 0.0) {
        const target = updates.shift();
        target.time = 0.0;
        const current = { position: new THREE.Vector3() };
        current.position.copy(world.components.mesh.get(eid).position);
        ecs.addComponents(world, eid, { meshTarget: { current, target } });
        if (!updates.length) {
          console.log("removing");
          ecs.removeComponents(world, eid, ["meshUpdates"]);
        }
      }
    });

    world.components.meshTarget.forEach((frame, eid) => {
      frame.target.time += deltaTime;
      const ratio = Math.max(Math.min(frame.target.time / 100.0, 1.0), 0.0);
      const desired = new THREE.Vector3();
      desired.copy(frame.current.position);
      desired.lerp(frame.target.mesh.position, ratio);
      const position = world.components.mesh.get(eid).position;
      position.x = desired.x;
      position.y = desired.y;
      position.z = desired.z;
    });
  },
};

export const debugSystem = () => {
  let updateCounter = 0;
  let frameTime1 = performance.now();
  return {
    name: "debugSystem",
    execute: () => {
      updateCounter++;
      if (updateCounter === 60) {
        const frameTime2 = performance.now();
        const frameDelta = frameTime2 - frameTime1;
        frameTime1 = frameTime2;
        const fps = 60 / (frameDelta * 0.001);
        console.log("fps", Math.round(fps));
        updateCounter = 0;
      }
    },
  };
};

export const controlSystem = {
  name: "controlSystem",
  execute: (world, deltaTime, time) => {
    // set latest target from updates
    world.components.control.forEach((_, eid) => {
      const position = world.components.mesh.get(eid).position;
      const speed = 0.01;
      let dirty = false;
      if (world.resources.downKeys.has(keyCodes["w"])) {
        dirty = true;
        position.y += speed * deltaTime;
      }
      if (world.resources.downKeys.has(keyCodes["s"])) {
        dirty = true;
        position.y -= speed * deltaTime;
      }
      if (world.resources.downKeys.has(keyCodes["a"])) {
        dirty = true;
        position.x -= speed * deltaTime;
      }
      if (world.resources.downKeys.has(keyCodes["d"])) {
        dirty = true;
        position.x += speed * deltaTime;
      }
      if (dirty) {
        world.resources.socket.emit("new position", {
          eid,
          position,
        });
      }
    });
  },
};
