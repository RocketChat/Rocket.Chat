'use strict';

const path = require('node:path');

/** The segmentation model, fetched and verified at build time. */
const model = {
	file: path.join(__dirname, 'dist', 'selfie_multiclass_256x256.tflite'),
	name: 'selfie_multiclass_256x256.tflite',
	sha256: 'c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0',
};

/** In the order the backgrounds panel offers them. */
const presets = [
	{ id: 'plain-light', file: path.join(__dirname, 'presets', 'plain-light.png'), contentType: 'image/png' },
	{ id: 'plain-dark', file: path.join(__dirname, 'presets', 'plain-dark.png'), contentType: 'image/png' },
	{ id: 'soft-gradient', file: path.join(__dirname, 'presets', 'soft-gradient.jpg'), contentType: 'image/jpeg' },
];

module.exports = { model, presets };
