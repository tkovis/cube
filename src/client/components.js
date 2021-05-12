import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";

export const playerComponents = () => {
  return { control: true };
};

export const onNewEntity = (world, eid, components) => {
  const position = components.mesh?.position;
  if (position) {
    const mesh = new THREE.Mesh(
      world.resources.geometries.cube,
      world.resources.materials.cube
    );
    mesh.position.x = position.x;
    mesh.position.y = position.y;
    mesh.position.z = position.z;
    world.resources.scene.add(mesh);
    components.mesh = mesh;
  }
  ecs.createEntity(world, eid, components);
};
