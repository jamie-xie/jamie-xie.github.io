#!/usr/bin/env node
/**
 * add-piece.js — Auto-scaffold a new piece from a URL.
 *
 * Fetches Open Graph / Twitter Card metadata and pre-fills a new entry
 * in pieces.js, downloads the hero image, and runs the build.
 *
 * Usage:
 *   npm run add-piece -- --url "https://example.com/article"
 *   npm run add-piece -- --url "..." --title "Override title" --slug "custom"
 *   npm run add-piece -- --url "..." --dry-run
 *
 * Options:
 *   --url <url>            (required) Article URL to scrape
 *   --title <text>         Override detected title
 *   --slug <slug>          Override auto-generated URL slug
 *   --contributors <names> Override detected author
 *   --publication <name>   Override detected site/publication
 *   --date <text>          Override detected date (e.g. "August 2026")
 *   --year <number>        Override year (defaults to current year)
 *   --image <path>         Use a local image path; skip auto-download
 *   --caption <text>       Image caption
 *   --body <text>          Full article body. Paragraphs separated by
 *                          blank lines (\\n\\n). You can also pipe from a file:
 *                            --body "$(cat article.txt)"
 *   --skip-image           Do not download the OG image even if found
 *   --dry-run              Preview what would be created; change nothing
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PIECES_PATH = path.join(ROOT, "pieces.js");
const ASSETS_DIR = path.join(ROOT, "assets");

/* ================================================================
   CLI parsing
   ================================================================ */

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

/* ================================================================
   HTTP fetching (text + binary, with redirect following)
   ================================================================ */

function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${url}`));
    }
    const mod = parsed.protocol === "https:" ? require("https") : require("http");

    const req = mod.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location)
            return reject(
              new Error(`Redirect (${res.statusCode}) without Location header`)
            );
          const redirectUrl = new URL(location, url).toString();
          if ((opts.redirectCount || 0) >= 5)
            return reject(new Error("Too many redirects"));
          return fetchUrl(redirectUrl, {
            ...opts,
            redirectCount: (opts.redirectCount || 0) + 1,
          }).then(resolve, reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ data, finalUrl: url }));
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

function fetchBinary(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? require("https") : require("http");

    const req = mod.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 15000,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location)
            return reject(new Error("Redirect without Location header"));
          if (redirectCount >= 5)
            return reject(new Error("Too many redirects"));
          return fetchBinary(
            new URL(location, url).toString(),
            redirectCount + 1
          ).then(resolve, reject);
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "",
          })
        );
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

/* ================================================================
   Metadata extraction (Open Graph, Twitter Cards, JSON-LD, <meta>)
   ================================================================ */

function parseMeta(html, finalUrl) {
  const meta = {};

  // helper: content may appear before or after property/name
  const getMeta = (prop) => {
    const m = html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    );
    if (m) return m[1].trim();
    const m2 = html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
        "i"
      )
    );
    return m2 ? m2[1].trim() : null;
  };

  meta.title =
    getMeta("og:title") ||
    getMeta("twitter:title") ||
    html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ||
    "";

  meta.description =
    getMeta("og:description") ||
    getMeta("twitter:description") ||
    getMeta("description") ||
    "";

  meta.image =
    getMeta("og:image") || getMeta("twitter:image") || "";

  meta.siteName = getMeta("og:site_name") || "";

  meta.author =
    getMeta("author") ||
    getMeta("article:author") ||
    getMeta("twitter:creator") ||
    "";

  meta.publishedTime = getMeta("article:published_time") || "";

  // JSON-LD fallback for author
  if (!meta.author) {
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        const authors =
          json.author || json.creator || (json.creator?.name ? [json.creator] : []);
        if (Array.isArray(authors)) {
          meta.author = authors
            .map((a) => (typeof a === "string" ? a : a.name))
            .filter(Boolean)
            .join(", ");
        } else if (typeof authors === "object" && authors !== null) {
          meta.author = authors.name || "";
        } else if (typeof authors === "string") {
          meta.author = authors;
        }
      } catch (e) {
        /* ignore malformed JSON-LD */
      }
    }
  }

  // Resolve relative image URLs
  if (meta.image) {
    if (meta.image.startsWith("//")) {
      meta.image = "https:" + meta.image;
    } else if (!meta.image.match(/^https?:\/\//i)) {
      meta.image = new URL(meta.image, finalUrl).toString();
    }
  }

  meta.title = decodeHtmlEntities(meta.title);
  meta.description = decodeHtmlEntities(meta.description);
  meta.siteName = decodeHtmlEntities(meta.siteName);
  meta.author = decodeHtmlEntities(meta.author);

  return meta;
}

/* ================================================================
}
}

/* ================================================================
   Helpers
   ================================================================ */

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function slugify(title, existingSlugs) {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);

  let unique = slug;
  let counter = 2;
  while (existingSlugs.has(unique)) {
    unique = `${slug}-${counter}`;
    counter++;
  }
  return unique;
}

function formatDate(isoDate) {
  if (!isoDate) {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch (e) {
    return isoDate;
  }
}

function extFromContentType(ct) {
  if (!ct) return "";
  if (ct.includes("image/webp")) return ".webp";
  if (ct.includes("image/png")) return ".png";
  if (ct.includes("image/gif")) return ".gif";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg")) return ".jpg";
  return "";
}

function formatPiece(p) {
  const bodyLines =
    p.body.length > 0
      ? p.body.map((s) => `      ${JSON.stringify(s)}`).join(",\n")
      : "";
  const bodyStr = p.body.length > 0 ? `[\n${bodyLines}\n    ]` : "[]";

  return `  {
    slug: ${JSON.stringify(p.slug)},
    title: ${JSON.stringify(p.title)},
    year: ${p.year},
    contributors: ${JSON.stringify(p.contributors)},
    link: { text: ${JSON.stringify(p.link.text)}, url: ${JSON.stringify(
      p.link.url
    )} },
    publication: ${JSON.stringify(p.publication)},
    date: ${JSON.stringify(p.date)},
    image: ${JSON.stringify(p.image)},
    caption: ${JSON.stringify(p.caption)},
    body: ${bodyStr},
  },`;
}

function addPieceToPiecesJs(pieceObj) {
  const content = fs.readFileSync(PIECES_PATH, "utf8");
  const lines = content.split("\n");

  // Insert after "const PIECES = [" so the new piece appears first
  const openIdx = lines.findIndex((line) => line.trim() === "const PIECES = [");
  if (openIdx === -1) {
    throw new Error("Could not find `const PIECES = [` in pieces.js");
  }

  const pieceLines = formatPiece(pieceObj).split("\n");
  lines.splice(openIdx + 1, 0, ...pieceLines);

  fs.writeFileSync(PIECES_PATH, lines.join("\n"), "utf8");
}

/* ================================================================
   Main
   ================================================================ */

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url) {
    console.error("Usage: npm run add-piece -- --url <article-url> [options]\n");
    console.error("Options:");
    console.error("  --title <text>          Override detected title");
    console.error("  --slug <slug>           Override auto-generated URL slug");
    console.error("  --contributors <names>  Override detected author");
    console.error("  --publication <name>    Override detected site/publication");
    console.error("  --date <text>           Override detected date");
    console.error("  --year <number>         Override year (default: current year)");
    console.error("  --image <path>          Use local image; skip download");
    console.error("  --caption <text>        Image caption");
    console.error('  --body <text>           Article body (use \\\\n\\\\n between paragraphs)');
    console.error('                          or pipe from file: --body "$(cat article.txt)"');
    console.error("  --skip-image            Skip OG image download");
    console.error("  --dry-run               Preview only; do not modify files");
    process.exit(1);
  }

  const dryRun = args["dry-run"] === true;

  /* ---- fetch page ---- */
  console.log(`Fetching: ${args.url}\n`);
  let html, finalUrl;
  try {
    const res = await fetchUrl(args.url);
    html = res.data;
    finalUrl = res.finalUrl;
  } catch (err) {
    console.error(`Error fetching URL: ${err.message}`);
    process.exit(1);
  }

  const meta = parseMeta(html, finalUrl);

  console.log("Detected metadata:");
  console.log(`  Title:       ${meta.title || "(none)"}`);
  console.log(
    `  Description: ${
      meta.description
        ? meta.description.substring(0, 80).replace(/\n/g, " ") +
          (meta.description.length > 80 ? "..." : "")
        : "(none)"
    }`
  );
  console.log(`  Image:       ${meta.image || "(none)"}`);
  console.log(`  Site:        ${meta.siteName || "(none)"}`);
  console.log(`  Author:      ${meta.author || "(none)"}`);
  console.log(`  Date:        ${meta.publishedTime || "(none)"}`);
  console.log("");

  /* ---- load existing slugs ---- */
  // eslint-disable-next-line no-unused-vars
  const { PIECES } = require(PIECES_PATH);
  const existingSlugs = new Set(PIECES.map((p) => p.slug));

  /* ---- build piece object ---- */
  const title = args.title || meta.title || "Untitled";
  const slug = args.slug || slugify(title, existingSlugs);
  const year = parseInt(args.year, 10) || new Date().getFullYear();
  const publication =
    args.publication ||
    meta.siteName ||
    new URL(finalUrl).hostname.replace(/^www\./, "");
  const date = args.date || formatDate(meta.publishedTime);
  const contributors = args.contributors || meta.author || "";

  let imagePath = args.image || "";
  const caption = args.caption || "";

  /* ---- download image ---- */
  if (!imagePath && meta.image && !args["skip-image"]) {
    try {
      console.log(`Downloading image: ${meta.image}`);
      const { buffer, contentType } = await fetchBinary(meta.image);
      const ext =
        extFromContentType(contentType) ||
        path.extname(new URL(meta.image).pathname) ||
        ".jpg";
      const filename = `${slug}${ext}`;
      const filepath = path.join(ASSETS_DIR, filename);

      if (!dryRun) {
        fs.writeFileSync(filepath, buffer);
        console.log(`Saved image: assets/${filename} (${buffer.length} bytes)\n`);
      } else {
        console.log(`[dry-run] Would save image: assets/${filename}\n`);
      }
      imagePath = `assets/${filename}`;
    } catch (err) {
      console.warn(`Warning: could not download image — ${err.message}\n`);
    }
  }

  /* ---- body text ---- */
  const body = [];
  if (args.body) {
    // Handle both literal \\n and actual newlines
    const raw = args.body.replace(/\\n/g, "\n");
    body.push(...raw.split(/\n\s*\n/).filter(Boolean));
  } else if (meta.description) {
    body.push(meta.description);
  }

  const piece = {
    slug,
    title,
    year,
    contributors,
    link: { text: "Link to piece", url: finalUrl },
    publication,
    date,
    image: imagePath,
    caption,
    body,
  };

  console.log("New piece object:");
  console.log(JSON.stringify(piece, null, 2));
  console.log("");

  if (dryRun) {
    console.log("[dry-run] No files were modified.");
    return;
  }

  /* ---- write to pieces.js ---- */
  try {
    addPieceToPiecesJs(piece);
    console.log(`Added "${title}" to pieces.js\n`);
  } catch (err) {
    console.error(`Error updating pieces.js: ${err.message}`);
    process.exit(1);
  }

  /* ---- run build ---- */
  try {
    console.log("Running npm run build...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
    console.log(`\nDone! New piece will be at: /${slug}/`);
  } catch (err) {
    console.error("\nBuild failed. You may need to run `npm run build` manually.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
