import sharp from "sharp";

await sharp("public/icons/icon.svg")
  .resize(192, 192)
  .png()
  .toFile("public/icons/icon-192.png");

await sharp("public/icons/icon.svg")
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-512.png");

console.log("Planora icons generated.");