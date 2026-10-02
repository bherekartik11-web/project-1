"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer between 1 and 65535.");

http.createServer((request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method)) {
    response.writeHead(request.url ? 405 : 400, { "Content-Type": "text/plain; charset=utf-8", "Allow": "GET, HEAD", "X-Content-Type-Options": "nosniff" });
    response.end(request.url ? "Method not allowed" : "Bad request");
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400); response.end("Bad request"); return; }
  if (pathname === "/") pathname = "/index.html";
  const file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found"); return; }
    const headers = {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-cache"
    };
    response.writeHead(200, headers);
    if (request.method === "HEAD") { response.end(); return; }
    const stream = fs.createReadStream(file);
    stream.on("error", () => { if (!response.headersSent) response.writeHead(500); response.end("Server error"); });
    stream.pipe(response);
  });
}).listen(port, "127.0.0.1", () => process.stdout.write(`Mockly is running at http://127.0.0.1:${port}\n`));
