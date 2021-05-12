const ecs = require("./ecs.js");
const { performance } = require("perf_hooks");

/**
 * Run ecs with "entityCount" entities, give all of them random position and velocity components, move them on each iteration according to moveSystem.
 * Also give them age, kill them when age runs out and on each update spawn entities until there are "entityCount" entities;
 */
const init = () => {
  const components = ["mesh", "velocity", "age", "socket"];
  const moveSystem = {
    name: "moveSystem",
    execute: (world, deltaTime, time) => {
      const moveEntity = (eid) => {
        const velocity = world.components.velocity.get(eid);
        const mesh = world.components.mesh.get(eid);
        mesh.position.x += velocity.x * deltaTime;
        mesh.position.y += velocity.y * deltaTime;
        mesh.position.z += velocity.z * deltaTime;

        mesh.rotation.x = time * velocity.x;
        mesh.rotation.y = time * velocity.y;
      };
      ecs.innerJoin(
        moveEntity,
        world.components.mesh,
        world.components.velocity
      );
    },
  };
  const agingSystem = {
    name: "agingSystem",
    execute: (world, deltaTime) => {
      for (const eid of world.components.age.keys()) {
        const currentAge = (world.components.age.get(eid).value -= deltaTime);
        if (currentAge < 0) {
          world.resources.scene.remove(world.components.mesh.get(eid));
          ecs.removeEntity(world, eid);
        }
      }
    },
  };
  let tickTimer = performance.now();
  const tickRate = 100;
  const updateSystem = {
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
        }
      }
      world.components.socket.forEach((socket) => {
        socket.emit("tick", updatedMeshes);
      });
      tickTimer = 0;
    },
  };
  const spawningSystem = {
    name: "spawningSystem",
    execute: (world) => {
      const currentEntityCount = world.entities.count;
      if (currentEntityCount < entityCount) {
        const delta = entityCount - currentEntityCount;
        for (let i = 0; i < delta; i++) {
          world.resources.createEntity(
            world,
            world.resources.createRandomEntityComponents(world)
          );
        }
      }
    },
  };

  let updates = 0;
  let t1 = performance.now();
  let timeElapsed = 0;

  const debugSystem = {
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

  const systems = [updateSystem];

  console.time("init");
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

  console.timeEnd("init");

  return world;
};

module.exports = init;
