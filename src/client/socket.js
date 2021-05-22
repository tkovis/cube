import io from "socket.io-client";
import * as worldHandlers from "./world.js";
import { playerComponents } from "./components.js";
import ecs from "./ecs.js";
import constants from "../shared/constants.json";
import * as THREE from "three";

const { tickRate, cameraDamping } = constants;

const secondsPerWord = 1 / 4;
const reactionTime = 1.5;

const messageDisplayer = (displayElement) => (username, textInput, mesh) => {
  const text = textInput.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " "); // remove extra whitespace
  const message = document.createElement("div");
  message.classList = "chat-text";
  message.innerText = `[${username}]: ${text}`;
  displayElement.append(message);

  const canvas = document.createElement("canvas");
  const context2d = canvas.getContext("2d");
  context2d.canvas.width = 256;
  context2d.canvas.height = 136;
  context2d.fillStyle = "rgba(128,128,128,0.5)";
  context2d.fillRect(0, 0, canvas.width, canvas.height);
  context2d.fillStyle = "#FFF";
  context2d.font = "18pt Helvetica";
  context2d.shadowOffsetX = 3;
  context2d.shadowOffsetY = 3;
  context2d.shadowColor = "rgba(0,0,0,0.3)";
  context2d.shadowBlur = 4;
  context2d.textAlign = "center";

  const maxWidth = context2d.canvas.width * 0.8;
  const words = text.split(" ");
  const lines = [];
  let currentLine = [];
  for (const word of words) {
    const line = [...currentLine, word].join(" ");
    const { width } = context2d.measureText(line);
    if (width < maxWidth) {
      currentLine.push(word);
    } else {
      lines.push(line);
      currentLine = [];
    }
  }
  const lastLine = currentLine.join(" ");
  if (lastLine) {
    lines.push(lastLine);
  }
  const lineHeight = 26;
  const truncated = lines.length > 4;
  const displayLines = lines.slice(0, 4);
  const offset = (lineHeight * displayLines.length) / 2;
  if (truncated) {
    displayLines[3] = displayLines[3].slice(0, -3).trim() + "...";
  }
  for (let i = 0; i < displayLines.length; i++) {
    const line = displayLines[i];
    context2d.fillText(line, 128, 64 - offset + lineHeight * (i + 1));
  }

  const map = new THREE.CanvasTexture(context2d.canvas);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: false })
  );
  sprite.scale.set(11, 6, 1);
  sprite.position.y += 5;

  const floatingName = mesh.children.find((c) => c.name === "floatingName");
  if (floatingName) {
    floatingName.visible = false;
  }
  mesh.add(sprite);

  const wordCount = text.split(" ").length;

  setTimeout(() => {
    if (floatingName) {
      floatingName.visible = true;
    }
    mesh?.remove(sprite);
    map?.dispose();
    canvas?.remove();
  }, Math.min((reactionTime + wordCount * secondsPerWord) * 1000, 10_000));
};

const setupSocket = (world) => {
  const URL = "/";
  const socket = io(URL, { autoConnect: false });

  socket.on("entities", (entities) => {
    for (const [eid, components] of Object.entries(entities)) {
      worldHandlers.onNewEntity(world, eid, components);
    }
  });

  socket.on("player spawned", ({ eid, components }) => {
    socket.eid = eid;
    worldHandlers.onNewEntity(world, eid, {
      ...components,
      ...playerComponents(world),
    });
    world.resources.username = components.username;
    const mesh = world.components.mesh.get(eid);
    world.resources.mesh = mesh;

    world.resources.controls = {
      currentPosition: new THREE.Vector3(),
      currentLookAt: new THREE.Vector3(),
      target: mesh,
    };

    const controlSystem = {
      name: "controlSystem",
      execute: (world, deltaTime) => {
        const { currentPosition, currentLookAt, target } =
          world.resources.controls;
        const camera = world.resources.camera;

        const idealOffset = new THREE.Vector3(-15, 20, -30);
        idealOffset.applyQuaternion(target.quaternion);
        idealOffset.add(target.position);

        const idealLookAt = new THREE.Vector3(0, 0, 2);
        idealLookAt.applyQuaternion(target.quaternion);
        idealLookAt.add(target.position);

        const t = 1.0 - Math.pow(cameraDamping, deltaTime / 1000);

        currentPosition.lerp(idealOffset, t);
        currentLookAt.lerp(idealLookAt, t);

        camera.position.copy(currentPosition);
        camera.lookAt(currentLookAt);
      },
    };
    ecs.registerSystem(world, controlSystem);
  });

  socket.on("new player", ({ eid, components }) => {
    worldHandlers.onNewEntity(world, eid, components);
  });

  socket.on("player left", ({ eid }) => {
    ecs.addComponents(world, eid, { kill: true });
  });

  socket.on("tick", (meshes) => {
    for (const [eid, mesh] of Object.entries(meshes)) {
      if (eid !== socket.eid) {
        ecs.appendToComponent(world, eid, "meshUpdates", {
          mesh,
          time: tickRate,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    window.location.reload();
  });

  const accessToken = sessionStorage.getItem("accessToken");
  socket.auth = { accessToken };
  socket.connect();

  window.addEventListener("beforeunload", () => socket.disconnect());

  world.resources.downKeys = new Set();

  const chatInputElement = document.getElementById("chat-input");
  const messageBoxElement = document.getElementById("chat-messages");
  const displayMessage = messageDisplayer(messageBoxElement);

  const ESCAPE = 27;
  const ENTER = 13;

  const onDocumentKeyDown = (e) => {
    if (document.activeElement === chatInputElement) {
      if (e.keyCode === ESCAPE) {
        chatInputElement.blur();
      }
      if (e.keyCode === ENTER) {
        const text = chatInputElement.value;
        socket.emit("chat-message", text);

        displayMessage(world.resources.username, text, world.resources.mesh);

        chatInputElement.value = "";
        chatInputElement.blur();
      }
      return;
    }
    if (e.keyCode === ENTER) {
      chatInputElement.focus();
    }
    world.resources.downKeys.add(e.keyCode);
    console.log(e.keyCode);
  };

  const onDocumentKeyUp = (e) => {
    if (document.activeElement === chatInputElement) return;
    world.resources.downKeys.delete(e.keyCode);
    console.log(e.keyCode);
  };

  socket.on("chat-message", ({ eid, username, text }) => {
    const mesh = world.components.mesh.get(eid);
    displayMessage(username, text, mesh);
  });

  document.addEventListener("keydown", onDocumentKeyDown);
  document.addEventListener("keyup", onDocumentKeyUp);

  world.resources.socket = socket;
};

export default setupSocket;
