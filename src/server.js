import express from "express";
import path from "path";
import http from "http";

export const app = express();
app.use(express.static(path.join(__dirname, "/client")));

export const server = http.createServer(app);
