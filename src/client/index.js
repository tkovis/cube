import { init } from "./world.js";
import setupSocket from "./socket.js";
import ecs from "./ecs.js";
import { strongRegex } from "../shared/regex";
import backend from "./backend";

const clearErrors = () => {
  const elements = document.getElementsByClassName("error-card");
  console.log([...elements]);
  [...document.getElementsByClassName("error-card")].forEach((element) => {
    element.className =
      element.className
        .split(" ")
        .filter((cn) => cn !== "invisible")
        .join("") + " invisible";
  });
};

const goToRegister = async (e) => {
  e.preventDefault();
  clearErrors();
  document.getElementById("login").style = "display: none;";
  document.getElementById("register").style = "";
};

document.getElementById("register-link").onclick = goToRegister;

const goToLogin = async (e) => {
  e?.preventDefault();
  clearErrors();
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
    const element = document.getElementById("register-success-display");
    element.className = element.className
      .split(" ")
      .filter((cn) => cn !== "invisible")
      .join(" ");
    return;
  }
  if (res.json.error) {
    const element = document.getElementById("register-error-display");
    element.innerText = res.json.error;
    element.className = element.className
      .split(" ")
      .filter((cn) => cn !== "invisible")
      .join(" ");
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
    return;
  }
  if (res.json.error) {
    const element = document.getElementById("login-error-display");
    element.innerText = res.json.error;
    element.className = element.className
      .split(" ")
      .filter((cn) => cn !== "invisible")
      .join(" ");
    return;
  }
};

document.getElementById("login-form").onsubmit = login;

const logout = async () => {
  sessionStorage.clear();
  location.reload();
};

document.getElementById("logout").onclick = logout;

const onPasswordChange = (e) => {
  const element = document.getElementById("register-password-validation-info");
  const classList = [...element.classList];
  if (
    classList.find((cn) => cn === "invisible") &&
    !strongRegex.test(e.target.value)
  ) {
    element.classList.remove("invisible");
    return;
  }
  if (
    !classList.find((cn) => cn === "invisible") &&
    strongRegex.test(e.target.value)
  ) {
    element.classList.add("invisible");
  }
};

document.getElementById("register-password").oninput = onPasswordChange;

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

const startGame = async () => {
  document.getElementById("pre-game").style = "display: none;";
  document.getElementById("canvas").style = "";
  document.getElementById("ui").style = "";
  const world = await init();

  setupSocket(world);

  ecs.run(world, performance.now());
};
