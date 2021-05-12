export default {
  createWorld: () => ({
    entities: { count: 0 },
    components: {},
    systems: [],
    resources: {},
  }),
  registerComponent: (world, name) => {
    world.components[name] = new Map();
  },
  createEntity: (world, eid, components = {}) => {
    world.entities[eid] = new Set(Object.keys(components));
    world.entities.count++;
    Object.entries(components).forEach(([name, value]) => {
      world.components[name].set(eid, value);
    });
  },
  removeEntity: (world, eid) => {
    const components = world.entities[eid];
    components.forEach((component) => {
      world.components[component].delete(eid);
    });
    delete world.entities[eid];
    world.entities.count--;
  },
  registerSystem: (world, system) => {
    world.systems.push(system);
  },
  addComponents: (world, eid, components) => {
    Object.keys(components).forEach((component) =>
      world.entities[eid].add(component)
    );
    Object.entries(components).forEach(([name, value]) => {
      world.components[name].set(eid, value);
    });
  },
  appendToComponent: (world, eid, component, value) => {
    world.entities[eid].add(component);
    world.components[component].get(eid)?.push(value) ||
      world.components[component].set(eid, [value]);
  },
  removeComponents: (world, eid, components) => {
    components.forEach((component) => {
      world.entities[eid].delete(component);
      world.components[component].delete(eid);
    });
  },
  run: (world, startTime) => {
    let lastTime = startTime;
    const step = (time) => {
      world.systems.forEach(({ execute }) => {
        try {
          execute(world, time - lastTime, time);
        } catch (e) {
          console.log(world);
          throw e;
        }
      });
      lastTime = time;
      requestAnimationFrame(step);
    };
    step(lastTime);
  },
  innerJoin: (fn, first, ...rest) => {
    first.forEach((_, key) => {
      if (rest.every((component) => component.has(key))) {
        fn(key);
      }
    });
  },
  outerJoin: (fn, ...components) => {
    const invocated = new Set();
    components.forEach((component) => {
      for (const key of component.keys()) {
        if (!invocated.has(key)) {
          invocated.add(key);
          fn(key);
        }
      }
    });
  },
};
