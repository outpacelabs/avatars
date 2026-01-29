import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputDir = "./public/avatars";
const outputDir = "./public/avatars/previews";

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Get all jpg files
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".jpg"));

console.log(`Converting ${files.length} images to 96x96 WebP...`);

for (const file of files) {
	const inputPath = path.join(inputDir, file);
	const outputPath = path.join(outputDir, file.replace(".jpg", ".webp"));

	await sharp(inputPath)
		.resize(96, 96, { fit: "cover" })
		.webp({ quality: 90 })
		.toFile(outputPath);

	console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);
}

console.log("Done!");
