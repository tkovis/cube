import * as THREE from "three";
import ecs from "./ecs.js";
import constants from "../shared/constants.json";

const { tickRate } = constants;

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
        const current = {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        };
        current.position.copy(world.components.mesh.get(eid).position);
        current.quaternion.copy(world.components.mesh.get(eid).quaternion);
        ecs.addComponents(world, eid, { meshTarget: { current, target } });
        if (!updates.length) {
          ecs.removeComponents(world, eid, ["meshUpdates"]);
        }
      }
    });

    world.components.meshTarget.forEach((frame, eid) => {
      frame.target.time += deltaTime;
      const ratio = Math.max(Math.min(frame.target.time / tickRate, 1.0), 0.0);
      const desiredPosition = new THREE.Vector3();
      const desiredQuaternion = new THREE.Quaternion();
      desiredPosition.copy(frame.current.position);
      desiredPosition.lerp(frame.target.mesh.position, ratio);
      desiredQuaternion.copy(frame.current.quaternion);
      desiredQuaternion.slerp(frame.target.mesh.quaternion, ratio);
      const { position, quaternion } = world.components.mesh.get(eid);
      position.x = desiredPosition.x;
      position.y = desiredPosition.y;
      position.z = desiredPosition.z;
      quaternion.x = desiredQuaternion.x;
      quaternion.y = desiredQuaternion.y;
      quaternion.z = desiredQuaternion.z;
      quaternion.w = desiredQuaternion.w;
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
      const mesh = world.components.mesh.get(eid);
      const speed = 0.01;
      let dirty = false;
      const downKeys = world.resources.downKeys;
      const forward = downKeys.has(keyCodes["w"]);
      const backward = downKeys.has(keyCodes["s"]);
      const leftTurn = downKeys.has(keyCodes["a"]);
      const rightTurn = downKeys.has(keyCodes["d"]);
      if (forward) {
        dirty = true;
        mesh.translateZ(speed * deltaTime);
      }
      if (backward) {
        dirty = true;
        mesh.translateZ(-speed * deltaTime);
      }
      if (leftTurn) {
        dirty = true;
        mesh.rotateOnAxis(
          new THREE.Vector3(0, 1, 0),
          ((Math.PI / 2) * deltaTime) / 1000
        );
      }
      if (rightTurn) {
        dirty = true;
        mesh.rotateOnAxis(
          new THREE.Vector3(0, 1, 0),
          (-(Math.PI / 2) * deltaTime) / 1000
        );
      }
      if ((forward || backward) && !(forward && backward)) {
        world.resources.toastMixer?.update(
          deltaTime * 0.001 * (forward ? 1 : -1)
        );
      }
      if (dirty) {
        world.resources.socket.emit("new position", {
          eid,
          position: mesh.position,
          quaternion: mesh.quaternion,
        });
      }
    });
  },
};
