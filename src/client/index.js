import { init } from "./world.js";
import setupSocket from "./socket.js";
import ecs from "./ecs.js";
import { strongRegex } from "../shared/regex";
import backend from "./backend";

const register = async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const res = await backend.post("/register", { username, password });

  if (res.status === 200) {
    document.getElementById("register").remove();
  }
};

document.getElementById("register-form").onsubmit = register;

const login = async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const res = await backend.post("/token", { username, password });
  if (res.status === 200) {
    sessionStorage.setItem("accessToken", res.json.accessToken);
    sessionStorage.setItem("refreshToken", res.json.refreshToken);
    startGame();
  }
};

document.getElementById("login-form").onsubmit = login;

const resumeSession = async () => {
  const preGameElement = document.getElementById("pre-game");
  const token = sessionStorage.getItem("refreshToken");
  if (!token) {
    preGameElement.style = "visibility: none;";
    return;
  }
  try {
    const { status, json } = await backend.post("/token", { token });
    if (status === 200) {
      sessionStorage.setItem("accessToken", json.accessToken);
      sessionStorage.setItem("refreshToken", json.refreshToken);
      preGameElement.style = "visibility: none;";
      startGame();
      return;
    }
    preGameElement.style = "visibility: none;";
    return;
  } catch (e) {
    preGameElement.style = "visibility: none;";
    return;
  }
};

resumeSession();

const startGame = () => {
  document.getElementById("login")?.remove();
  document.getElementById("register")?.remove();
  const world = init();

  setupSocket(world);

  ecs.run(world, performance.now());
};
