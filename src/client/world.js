import ecs from "./ecs.js";
import * as THREE from "three";
import {
  moveSystem,
  debugSystem,
  controlSystem,
  killSystem,
} from "./systems.js";
import { cubeDimension } from "../shared/constants.json";

const systems = [killSystem, moveSystem, debugSystem(), controlSystem];

const createRenderer = (canvas) =>
  new THREE.WebGLRenderer({
    canvas,
  });

const createCamera = () => {
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.y = 30;
  camera.position.z = -30;
  return camera;
};

const addDirectionalLight = (scene) => {
  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
};

const addAmbientLight = (scene) => {
  const color = 0xffffff;
  const intensity = 0.4;
  const light = new THREE.AmbientLight(color, intensity);
  scene.add(light);
};

const addGround = (scene) => {
  const geo = new THREE.PlaneGeometry(100, 100);
  const mat = new THREE.MeshLambertMaterial();
  const ground = new THREE.Mesh(geo, mat);
  ground.position.x = 0;
  ground.position.y = 0;
  ground.position.z = 0;
  ground.rotation.x = Math.PI * -0.5;
  scene.add(ground);
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
  const canvas = document.querySelector("#canvas");
  const renderer = createRenderer(canvas);
  const camera = createCamera();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  addDirectionalLight(scene);
  addAmbientLight(scene);
  addGround(scene);

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

  world.resources.canvas = canvas;
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

  const geometry = new THREE.BoxGeometry(
    cubeDimension,
    cubeDimension,
    cubeDimension
  );

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
