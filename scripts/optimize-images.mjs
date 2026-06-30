import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve("public");

async function optimize({ input, output, maxWidth, maxBytes, qualityStart = 88 }) {
  let quality = qualityStart;
  let lastBuffer;

  while (quality >= 60) {
    lastBuffer = await sharp(input)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();

    if (lastBuffer.length <= maxBytes || quality === 60) break;
    quality -= 4;
  }

  fs.writeFileSync(output, lastBuffer);
  const meta = await sharp(lastBuffer).metadata();
  console.log(
    `${path.relative(root, output)}: ${Math.round(lastBuffer.length / 1024)}KB (${meta.width}x${meta.height}, q=${quality})`
  );
}

async function optimizeProfile(input, output, size = 480) {
  const buf = await sharp(input)
    .rotate()
    .resize(size, size, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  fs.writeFileSync(output, buf);
  console.log(`${path.relative(root, output)}: ${Math.round(buf.length / 1024)}KB`);
}

const profiles = [
  "images/committee/bilel triki.jpg",
  "images/committee/nour gaddes.jpg",
  "images/committee/amenallah ibrahmi.jpg",
  "images/committee/ismail ammar.jpg",
  "images/majors/meriem kaffela.jpg",
  "images/majors/Yasmine Belghalmi.jpg",
  "images/moderators/kmar mejri.jpg",
  "images/moderators/Rihem Ben Cheikh.jpg",
  "images/moderators/amenallah ibrahmi.jpg",
];

await optimize({
  input: path.join(root, "background.jpg"),
  output: path.join(root, "background.webp"),
  maxWidth: 2560,
  maxBytes: 1.5 * 1024 * 1024,
});

for (const name of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
  await optimize({
    input: path.join(root, "images/gallery", `${name}.jpg`),
    output: path.join(root, "images/gallery", `${name}.webp`),
    maxWidth: 1920,
    maxBytes: 800 * 1024,
  });
}

for (const rel of profiles) {
  await optimizeProfile(
    path.join(root, rel),
    path.join(root, rel.replace(/\.jpg$/i, ".webp"))
  );
}
