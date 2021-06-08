import * as THREE from "three";
import { Pathfinding } from "three-pathfinding";
import { AStar } from "./pathfinding/AStar";
import { Channel } from "./pathfinding/Channel";

const pathfinding = new Pathfinding();
const ZONE = "level1";

const setZoneData = (geometry) => {
  pathfinding.setZoneData(ZONE, Pathfinding.createZone(geometry));
};

const getGroupId = (position) => pathfinding.getGroup(ZONE, position);

const findPath = (startPosition, targetPosition, zoneID, groupID) => {
  const nodes = pathfinding.zones[zoneID].groups[groupID];
  const vertices = pathfinding.zones[zoneID].vertices;

  const closestNode = pathfinding.getClosestNode(
    startPosition,
    zoneID,
    groupID,
    true
  );
  const farthestNode = pathfinding.getClosestNode(
    targetPosition,
    zoneID,
    groupID,
    true
  );

  console.log({ closestNode, farthestNode });

  // If we can't find any node, just go straight to the target
  if (!closestNode || !farthestNode) {
    return null;
  }

  const paths = AStar.search(nodes, closestNode, farthestNode);

  const getPortalFromTo = function (a, b) {
    for (var i = 0; i < a.neighbours.length; i++) {
      if (a.neighbours[i] === b.id) {
        return a.portals[i];
      }
    }
  };

  // We have the corridor, now pull the rope.
  const channel = new Channel();
  channel.push(startPosition);
  for (let i = 0; i < paths.length; i++) {
    const polygon = paths[i];
    const nextPolygon = paths[i + 1];

    if (nextPolygon) {
      const portals = getPortalFromTo(polygon, nextPolygon);
      channel.push(vertices[portals[0]], vertices[portals[1]]);
    }
  }
  channel.push(targetPosition);
  channel.stringPull();

  const path = channel.path.map((c) => new THREE.Vector3(c.x, c.y, c.z));
  return path;
};

export const getNavigationHandler = (world, eid) => {
  const raycaster = new THREE.Raycaster();
  const target = new THREE.Vector3();
  const current = new THREE.Vector3();
  const { scene, camera, navMesh, ground } = world.resources;
  const mesh = world.components.mesh.get(eid);
  const mouse = {};

  navMesh.scale.setScalar(8);
  setZoneData(navMesh.geometry);

  const navWireframe = new THREE.Mesh(
    navMesh.geometry,
    new THREE.MeshBasicMaterial({
      color: 0x808080,
      wireframe: true,
    })
  );
  navWireframe.position.y = 0.2 / 2;
  scene.add(navWireframe);

  const navmesh = new THREE.Mesh(
    navMesh.geometry,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff).convertGammaToLinear(2.2).getHex(),
      opacity: 0.75,
      transparent: true,
    })
  );

  scene.add(navmesh);

  return (event) => {
    const position = mesh.position;
    current.x = position.x;
    current.z = position.z;
    const groupId = getGroupId(current);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);

    const insersectionPoint = raycaster.intersectObject(navMesh)[0]?.point;
    console.log(insersectionPoint);
    if (!insersectionPoint) return;

    target.copy(insersectionPoint);
    current.y = insersectionPoint.y;

    // Calculate a path to the target and store it
    const path = findPath(current, target, ZONE, groupId);
    console.log({ path });

    if (path?.length) {
      mesh.path = path;
    }
  };
};
