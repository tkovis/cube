import { init } from "./world.js";
import setupSocket from "./socket.js";
import ecs from "./ecs.js";
import { strongRegex } from "../shared/regex";
import backend from "./backend";

const goToRegister = async (e) => {
  e.preventDefault();
  document.getElementById("login").style = "display: none;";
  document.getElementById("register").style = "";
};

document.getElementById("register-link").onclick = goToRegister;

const goToLogin = async (e) => {
  e?.preventDefault();
  document.getElementById("register").style = "display: none;";
  document.getElementById("login").style = "";
};

document.getElementById("login-link").onclick = goToLogin;

const register = async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const res = await backend.post("/register", { username, password });

  if (res.status === 200) {
    goToLogin();
    document.getElementById("login-username").value = username;
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

const logout = async () => {
  sessionStorage.clear();
  location.reload();
};

document.getElementById("logout").onclick = logout;

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
  document.getElementById("pre-game").style = "display: none;";
  document.getElementById("canvas").style = "";
  document.getElementById("ui").style = "";
  const world = init();

  setupSocket(world);

  ecs.run(world, performance.now());
};
