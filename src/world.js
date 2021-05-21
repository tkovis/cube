import ecs from "./ecs.js";
import { updateSystem, debugSystem } from "./systems.js";
import constants from "./shared/constants.json";
import db from "./db";

const { cubeDimension } = constants;

export const init = () => {
  const components = ["mesh", "velocity", "age", "socket", "username"];
  const systems = [updateSystem() /*debugSystem()*/];
  const world = ecs.createWorld();

  components.forEach((component) => {
    ecs.registerComponent(world, component);
  });

  const createEntity = ecs.initializeCreateEntity();

  world.resources.createEntity = createEntity;

  const createPlayerComponents = async (eid, username) => {
    const mesh = (await db.get(`entities.${eid}.mesh`)) || {
      position: { x: 0, y: cubeDimension / 2, z: 0 },
      quaternion: {},
    };
    mesh.position = mesh.position || { x: 0, y: cubeDimension / 2, z: 0 };
    mesh.quaternion = mesh.quaternion || {};
    return {
      mesh,
      username,
    };
  };

  world.resources.createPlayerComponents = createPlayerComponents;

  systems.forEach((system) => {
    ecs.registerSystem(world, system);
  });

  return world;
};
