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

  const res = await backend.post("/login", { username, password });
  if (res.status === 200) {
    startGame();
  }
};

document.getElementById("login-form").onsubmit = login;

const startGame = () => {
  document.getElementById("login")?.remove();
  document.getElementById("register")?.remove();
  const world = init();

  setupSocket(world);

  ecs.run(world, performance.now());
};
