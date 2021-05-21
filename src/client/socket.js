import io from "socket.io-client";
import * as worldHandlers from "./world.js";
import { playerComponents } from "./components.js";
import ecs from "./ecs.js";
import constants from "../shared/constants.json";
import * as THREE from "three";

const { tickRate, cameraDamping } = constants;

const setupSocket = (world) => {
  const URL = "/";
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
    const mesh = world.components.mesh.get(eid);

    world.resources.controls = {
      currentPosition: new THREE.Vector3(),
      currentLookAt: new THREE.Vector3(),
      target: mesh,
    };

    const controlSystem = {
      name: "controlSystem",
      execute: (world, deltaTime) => {
        const { currentPosition, currentLookAt, target } =
          world.resources.controls;
        const camera = world.resources.camera;

        const idealOffset = new THREE.Vector3(-15, 20, -30);
        idealOffset.applyQuaternion(target.quaternion);
        idealOffset.add(target.position);

        const idealLookAt = new THREE.Vector3(0, 0, 2);
        idealLookAt.applyQuaternion(target.quaternion);
        idealLookAt.add(target.position);

        const t = 1.0 - Math.pow(cameraDamping, deltaTime / 1000);

        currentPosition.lerp(idealOffset, t);
        currentLookAt.lerp(idealLookAt, t);

        camera.position.copy(currentPosition);
        camera.lookAt(currentLookAt);
      },
    };
    ecs.registerSystem(world, controlSystem);
  });

  socket.on("new player", ({ eid, components }) => {
    worldHandlers.onNewEntity(world, eid, components);
  });

  socket.on("player left", ({ eid }) => {
    ecs.addComponents(world, eid, { kill: true });
  });

  socket.on("tick", (meshes) => {
    for (const [eid, mesh] of Object.entries(meshes)) {
      if (eid !== socket.eid) {
        ecs.appendToComponent(world, eid, "meshUpdates", {
          mesh,
          time: tickRate,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    window.location.reload();
  });

  const accessToken = sessionStorage.getItem("accessToken");
  socket.auth = { accessToken };
  socket.connect();

  window.addEventListener("beforeunload", () => socket.disconnect());

  world.resources.socket = socket;
};

export default setupSocket;
