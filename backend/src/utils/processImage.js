const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

const processImage = async (filename) => {
  if (!filename) return filename;
  const inputPath = path.join(uploadDir, filename);
  const baseName = filename.replace(/\.[^.]+$/, '');
  const outputName = baseName + '.jpg';
  const outputPath = path.join(uploadDir, outputName);

  try {
    await sharp(inputPath)
      .rotate()
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(outputPath);

    if (outputName !== filename) fs.unlink(inputPath, () => {});
    return outputName;
  } catch (err) {
    console.error('Image processing failed:', err.message);
    return filename;
  }
};

module.exports = { processImage };
