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
      const { x, y, z, w } = frame.target.mesh.quaternion
      const targetQuaternion = new THREE.Quaternion(x, y, z, w);
      desiredPosition.copy(frame.current.position);
      desiredPosition.lerp(frame.target.mesh.position, ratio);
      desiredQuaternion.copy(frame.current.quaternion);
      desiredQuaternion.slerp(targetQuaternion, ratio);
      const mesh = world.components.mesh.get(eid);
      const { position, quaternion } = mesh;
      mesh.mixer?.update(deltaTime * 0.001);
      position.x = desiredPosition.x;
      position.y = desiredPosition.y;
      position.z = desiredPosition.z;
      quaternion.x = desiredQuaternion.x;
      quaternion.y = desiredQuaternion.y;
      quaternion.z = desiredQuaternion.z;
      quaternion.w = desiredQuaternion.w;
      ecs.removeComponents(world, eid, ["meshTarget"]);
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
      const position = mesh?.position;
      const path = mesh?.path;
      if (path?.length) {
        mesh.mixer.update(deltaTime * 0.001);
        const target = new THREE.Vector3();
        target.y = position.y;
        target.x = path[0].x;
        target.z = path[0].z;
        mesh.lookAt(target);
        const velocity = target.clone().sub(position);

        if (velocity.lengthSq() > 0.5 * 0.5) {
          velocity.normalize();
          // Move player to target
          position.add(velocity.multiplyScalar(deltaTime * 0.001 * 10));
          world.resources.socket.emit("new position", {
            eid,
            position: mesh.position,
            quaternion: mesh.quaternion,
          });
        } else {
          // Remove node from the path we calculated
          path.shift();
        }
      }
    });
  },
};
