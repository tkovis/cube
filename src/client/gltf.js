import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

const load = (resourceUrl, onProgress) =>
  new Promise((resolve, reject) => {
    // Load a glTF resource
    loader.load(
      resourceUrl,
      (gltf) => resolve(gltf),
      onProgress,
      (error) => reject(error)
    );
  });

export default {
  load,
};
