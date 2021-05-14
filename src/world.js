import ecs from "./ecs.js";
import { updateSystem } from "./systems.js";

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
    const mesh = { position: {}, rotation: {} };
    mesh.position.x = (Math.random() - 0.5 + Number.EPSILON) * 10;
    mesh.position.y = (Math.random() - 0.5 + Number.EPSILON) * 10;
    mesh.position.z = (Math.random() - 0.5 + Number.EPSILON) * 10;
    return {
      mesh,
      velocity: {
        x: (Math.random() - 0.5) * 0.001 + Number.EPSILON,
        y: (Math.random() - 0.5) * 0.001 + Number.EPSILON,
        z: (Math.random() - 0.5) * 0.001 + Number.EPSILON,
      },
    };
  };

  world.resources.createRandomEntityComponents = createRandomEntityComponents;

  systems.forEach((system) => {
    ecs.registerSystem(world, system);
  });

  return world;
};
