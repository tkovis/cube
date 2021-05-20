import ecs from "./ecs";

const newPosition =
  (world) =>
  ({ eid, position: newPosition, quaternion: newQuaternion }) => {
    const mesh = world.components.mesh.get(eid);
    mesh.dirty = true;
    const { position, quaternion } = mesh;
    position.x = newPosition.x;
    position.y = newPosition.y;
    position.z = newPosition.z;
    quaternion.x = newQuaternion._x;
    quaternion.y = newQuaternion._y;
    quaternion.z = newQuaternion._z;
    quaternion.w = newQuaternion._w;
  };

const handleNewPlayer = (world) => (socket) => {
  const entityData = {};
  for (const [eid, components] of Object.entries(world.entities)) {
    if (eid !== "count") {
      entityData[eid] = {};
      for (const component of components) {
        if (component !== "socket") {
          entityData[eid][component] = world.components[component].get(eid);
        }
      }
    }
  }
  socket.emit("entities", entityData);

  const components = world.resources.createRandomEntityComponents();
  const eid = world.resources.createEntity(world, { ...components, socket });
  const player = { eid, components };
  socket.emit("player spawned", player);

  socket.on("new position", newPosition(world));

  socket.on("disconnect", () => {
    ecs.removeEntity(world, eid);
    socket.broadcast.emit("player left", {
      eid,
    });
  });

  socket.broadcast.emit("new player", player);
};

export default ({ world }) => [["connection", handleNewPlayer(world)]];
