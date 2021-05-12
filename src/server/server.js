const express = require("express");
var path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "../client")));

const server = require("http").createServer(app);

module.exports = { server, app };
