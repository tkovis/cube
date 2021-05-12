import { init } from "./world.js";
import setupSocket from "./socket.js";
import ecs from "./ecs.js";

const world = init();

setupSocket(world);

ecs.run(world, performance.now());
