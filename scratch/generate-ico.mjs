import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const svgPath = path.resolve("public/icon.svg");
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate 512x512 PNG
  await sharp(svgBuffer).resize(512, 512).png().toFile("public/icon-512.png");
  // Generate 192x192 PNG
  await sharp(svgBuffer).resize(192, 192).png().toFile("public/icon-192.png");
  // Generate 180x180 apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile("public/apple-touch-icon.png");

  // Generate 16, 32, 48 buffers for ICO
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  // Also save in app/ for Next.js convention
  fs.copyFileSync("public/icon.svg", "app/icon.svg");
  await sharp(svgBuffer).resize(32, 32).png().toFile("app/favicon.ico");

  // Construct valid multi-resolution ICO file
  const images = [
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ];

  const headerSize = 6;
  const dirEntrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(images.length, 4); // Number of images

  let currentOffset = headerSize + dirEntrySize * images.length;
  const entries = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2); // Colors in palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset
    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)]);
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  fs.writeFileSync("app/favicon.ico", icoBuffer);

  console.log("✓ Successfully generated ultra-crisp favicons and app icons!");
}

main().catch(console.error);
