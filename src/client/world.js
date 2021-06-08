import ecs from "./ecs.js";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
import gltf from "./gltf";
import {
  moveSystem,
  debugSystem,
  controlSystem,
  killSystem,
} from "./systems.js";
import constants from "../shared/constants.json";

const { cubeDimension } = constants;

const systems = [killSystem, moveSystem, debugSystem(), controlSystem];

const createRenderer = (canvas) =>
  new THREE.WebGLRenderer({
    canvas,
  });

const createCamera = (radius) => {
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.OrthographicCamera(
    -radius,
    radius,
    radius,
    -radius,
    near,
    far
  );
  camera.position.set(radius, radius, radius);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
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
  "username",
];

export const init = async () => {
  const canvas = document.querySelector("#canvas");
  const renderer = createRenderer(canvas);
  const radius = 40;
  const camera = createCamera(radius);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  addDirectionalLight(scene);
  addAmbientLight(scene);

  function render() {
    renderer.render(scene, camera);

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      const aspect = canvas.clientWidth / canvas.clientHeight;
      const height = radius / aspect;
      const width = radius * aspect;
      camera.left = -width;
      camera.right = width;
      console.log(
        { camera, height, width },
        aspect,
        canvas.clientWidth,
        canvas.clientHeight
      );
      camera.updateProjectionMatrix();
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  console.time("init");
  const world = ecs.createWorld();

  world.resources.cameraOffset = radius;

  const navLoad = gltf.load("./assets/gltf/ground.nav.gltf").then((gltf) => {
    gltf.scene.traverse((node) => {
      if (node.name === "ground") {
        world.resources.ground = node;
      }
      if (node.name === "ground_nav") {
        world.resources.navMesh = node;
      }
    });
  });

  const groundLoad = gltf.load("./assets/gltf/ground.gltf").then((gltf) => {
    gltf.scene.traverse((node) => {
      if (node.name === "ground") {
        scene.add(node);
      }
    });
  });

  const modelLoad = gltf.load("./assets/gltf/4amigops.gltf").then((gltf) => {
    gltf.scene.scale.setScalar(8);

    gltf.scene.traverse((c) => {
      // prevent rae from blinking in and out of existance
      c.frustumCulled = false;
    });

    scene.add(gltf.scene);

    const [toastMesh] = gltf.scene.children.find(
      (c) => c.name === "toast_control"
    ).children;
    const [walk] = gltf.animations;
    toastMesh.animation = { walk };

    world.resources.models = world.resources.model || {};
    world.resources.models.toast = toastMesh;
  });

  world.resources.canvas = canvas;

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

  await modelLoad;
  await groundLoad;
  await navLoad;

  return world;
};

export const onNewEntity = (world, eid, components) => {
  if (components.mesh) {
    const { position, quaternion } = components.mesh;
    console.log(world.resources.models.toast);
    const toastBase = world.resources.models.toast;
    const mesh = SkeletonUtils.clone(toastBase);
    const mixer = new THREE.AnimationMixer(mesh);
    const walk = mixer.clipAction(toastBase.animation.walk);
    walk.play();
    mesh.mixer = mixer;
    console.log(mesh);
    mesh.scale.setScalar(2);
    mesh.position.x = position.x;
    mesh.position.y = position.y;
    mesh.position.z = position.z;
    const { x = 0, y = 0, z = 0, w = 0 } = quaternion;
    mesh.setRotationFromQuaternion(new THREE.Quaternion(x, y, z, w));
    world.resources.scene.add(mesh);
    components.mesh = mesh;
  }
  if (components.username && components.mesh) {
    const context2d = document.createElement("canvas").getContext("2d");
    context2d.canvas.width = 256;
    context2d.canvas.height = 128;
    context2d.fillStyle = "#FFF";
    context2d.font = "22pt Helvetica";
    context2d.shadowOffsetX = 3;
    context2d.shadowOffsetY = 3;
    context2d.shadowColor = "rgba(0,0,0,0.3)";
    context2d.shadowBlur = 4;
    context2d.textAlign = "center";
    context2d.fillText(components.username, 128, 64);

    const map = new THREE.CanvasTexture(context2d.canvas);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: false })
    );
    sprite.name = "floatingName";
    sprite.scale.set(6, 3, 1);
    sprite.position.y += 5;
    components.mesh.add(sprite);
  }

  ecs.createEntity(world, eid, components);
};
