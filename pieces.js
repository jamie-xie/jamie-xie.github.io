/* ============================================================
   Site content — edit this file to add / update pieces.
   Each piece gets its own sub-URL: /{slug}/

   To add a new piece:
     1. add an entry to PIECES below
     2. create a folder named {slug} containing a copy of the
        generic piece page (see any existing piece folder)
   ============================================================ */

const READING = {
  label: "Currently reading:",
  book: "[Book title]",
  date: "[Date]",
};

const LOREM_1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consectetur erat et pretium blandit. Aliquam sit amet porta libero. Vestibulum accumsan quis tortor sed varius. Aenean mattis ultrices dolor, eu venenatis lacus hendrerit quis. Ut rutrum ligula in orci fermentum condimentum. In dapibus, mauris in gravida pretium, dolor magna accumsan justo, sit amet dictum nunc velit et tortor. In nec risus est. Curabitur ut lacus sit amet ex bibendum fringilla. Nam placerat ipsum eget lectus interdum lacinia.";
const LOREM_2 =
  "Proin suscipit est quis est tempus cursus. Donec at consequat neque, ut finibus enim. Fusce ut arcu dolor. Proin non leo quis dui scelerisque porttitor at sed nulla. Sed at bibendum libero, id bibendum nisl. Quisque id venenatis ante, in auctor ex. Donec eu fermentum est. Ut ullamcorper a nibh tempus suscipit. Etiam eu dolor nisl.";

const PIECES = [
  {
    slug: "title-of-piece-1",
    title: "Title of piece",
    year: 2026,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png", // placeholder image (the panda)
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-2",
    title: "Title of piece",
    year: 2026,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-3",
    title: "Title of piece",
    year: 2025,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-4",
    title: "Title of piece",
    year: 2025,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-5",
    title: "Title of piece",
    year: 2025,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-6",
    title: "Title of piece",
    year: 2024,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-7",
    title: "Title of piece",
    year: 2024,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
  {
    slug: "title-of-piece-8",
    title: "Title of piece",
    year: 2023,
    contributors: "Names of contributors",
    link: { text: "Link to piece", url: "#" },
    publication: "publication",
    date: "date",
    image: "assets/huahua.png",
    caption: "Photo to go with piece (optional, if wanted)",
    body: [LOREM_1, LOREM_2],
  },
];

// Lets the build script (build.js) read this file in Node. Ignored by browsers.
if (typeof module !== "undefined") module.exports = { PIECES, READING };
