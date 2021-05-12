import ecs from "./ecs.js";
import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import {
  moveSystem,
  debugSystem,
  controlSystem,
  killSystem,
} from "./systems.js";

const systems = [killSystem, moveSystem, debugSystem(), controlSystem];

const createRenderer = () =>
  new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
  });

const createCamera = () => {
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 30;
  return camera;
};

const addDirectionalLight = (scene) => {
  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
};

const resizeRendererToDisplaySize = (renderer) => {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = (canvas.clientWidth * pixelRatio) | 0;
  const height = (canvas.clientHeight * pixelRatio) | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
};

const components = [
  "mesh",
  "meshUpdates",
  "meshTarget",
  "control",
  "velocity",
  "age",
  "kill",
];

export const init = () => {
  const renderer = createRenderer();
  const camera = createCamera();
  const scene = new THREE.Scene();
  addDirectionalLight(scene);

  function render() {
    renderer.render(scene, camera);

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  console.time("init");
  const world = ecs.createWorld();

  world.resources.downKeys = new Set();

  const onDocumentKeyDown = (e) => {
    world.resources.downKeys.add(e.keyCode);
    console.log(e.keyCode);
  };

  const onDocumentKeyUp = (e) => {
    world.resources.downKeys.delete(e.keyCode);
    console.log(e.keyCode);
  };

  document.addEventListener("keydown", onDocumentKeyDown);
  document.addEventListener("keyup", onDocumentKeyUp);

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

  world.resources.scene = scene;
  world.resources.materials = {};
  world.resources.materials.cube = material;
  world.resources.geometries = {};
  world.resources.geometries.cube = geometry;
  world.resources.camera = camera;

  components.forEach((component) => {
    ecs.registerComponent(world, component);
  });

  systems.forEach((system) => {
    ecs.registerSystem(world, system);
  });

  console.timeEnd("init");

  return world;
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
