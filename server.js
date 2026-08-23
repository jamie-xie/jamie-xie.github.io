/* Zero-dependency static file server for local preview.
   Usage:  npm run dev            (defaults to http://localhost:7100)
           node server.js --port 8080 --host 0.0.0.0                 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function arg(name, fallback) {
  const eq = process.argv.find((a) => a.startsWith("--" + name + "="));
  if (eq) return eq.split("=")[1];
  const i = process.argv.indexOf("--" + name);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const PORT = Number(arg("port", process.env.PORT || 7100));
const HOST = arg("host", process.env.HOST || "0.0.0.0");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    // directory -> its index.html
    let filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");
    else if (!path.extname(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("404 — not found");
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, HOST, () => console.log(`Preview running at http://localhost:${PORT}/`));
