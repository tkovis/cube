import ecs from "./ecs.js";
import { updateSystem } from "./systems.js";
import constants from "./shared/constants.json";

const { cubeDimension } = constants;

/**
 * Run ecs with "entityCount" entities, give all of them random position and velocity components, move them on each iteration according to moveSystem.
 * Also give them age, kill them when age runs out and on each update spawn entities until there are "entityCount" entities;
 */
export const init = () => {
  const components = ["mesh", "velocity", "age", "socket"];
  const systems = [updateSystem()];
  const world = ecs.createWorld();

  components.forEach((component) => {
    ecs.registerComponent(world, component);
  });

  const createEntity = ecs.initializeCreateEntity();

  world.resources.createEntity = createEntity;

  const createRandomEntityComponents = () => {
    const mesh = { position: {}, quaternion: {} };
    mesh.position.x = 0;
    mesh.position.y = cubeDimension / 2;
    mesh.position.z = 0;
    return {
      mesh,
    };
  };

  world.resources.createRandomEntityComponents = createRandomEntityComponents;

  systems.forEach((system) => {
    ecs.registerSystem(world, system);
  });

  return world;
};
