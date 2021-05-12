# Data oriented entity component system (ecs) implementation inspired by [simondev](https://www.youtube.com/channel/UCEwhtpXrg5MmwlH04ANpL8A)

See src/snapshots and src/tests for api demonstration or even src/benchmark.mjs.
See src/ecs.mjs for the source code (very lightweight, 76 LoC).
Load benchmark.html through a server to see a sample benchmark and do profiles.

At higher entity counts rendering takes all the time with my current setup. You can disable rendering by commenting out

```
requestAnimationFrame(render);
```
