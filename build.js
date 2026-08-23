/* build.js — generates one sub-URL folder per piece in pieces.js.
   Run after editing pieces.js:   npm run build

   - creates {slug}/index.html for every piece
   - rewrites folders whose template changed
   - deletes stale generated folders (pieces you removed)
   Only folders containing a byte-identical copy of the template are
   ever touched, so hand-made pages are safe.                        */

const fs = require("fs");
const path = require("path");
const { PIECES } = require("./pieces.js");

const ROOT = __dirname;
const template = fs.readFileSync(path.join(ROOT, "piece-template", "index.html"), "utf8");
const KEEP = new Set(["assets", "piece-template", "node_modules", ".git"]);
const slugs = new Set(PIECES.map((p) => p.slug));

// check for duplicate slugs (they would collide on the same URL)
const seen = new Set();
PIECES.forEach((p) => {
  if (seen.has(p.slug)) {
    console.error(`Duplicate slug "${p.slug}" in pieces.js — fix it first.`);
    process.exit(1);
  }
  seen.add(p.slug);
});

// remove stale generated folders
fs.readdirSync(ROOT, { withFileTypes: true }).forEach((d) => {
  if (!d.isDirectory() || KEEP.has(d.name) || slugs.has(d.name)) return;
  const f = path.join(ROOT, d.name, "index.html");
  if (fs.existsSync(f) && fs.readFileSync(f, "utf8") === template) {
    fs.rmSync(path.join(ROOT, d.name), { recursive: true });
    console.log(`removed stale page: ${d.name}/`);
  }
});

// create / update piece folders
PIECES.forEach((p) => {
  const dir = path.join(ROOT, p.slug);
  const f = path.join(dir, "index.html");
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== template) {
    fs.writeFileSync(f, template);
    console.log(`wrote: ${p.slug}/index.html`);
  }
});

console.log(`Done — ${PIECES.length} piece pages are in sync with pieces.js.`);
