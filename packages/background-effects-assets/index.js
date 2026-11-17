'use strict';

const path = require('node:path');

/** The segmentation model, fetched and verified at build time. */
const model = {
	file: path.join(__dirname, 'dist', 'selfie_segmenter.tflite'),
	name: 'selfie_segmenter.tflite',
	sha256: '191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b',
};

/** In the order the backgrounds panel offers them. */
const presets = [
	{ id: 'plain-light', file: path.join(__dirname, 'presets', 'plain-light.png'), contentType: 'image/png' },
	{ id: 'plain-dark', file: path.join(__dirname, 'presets', 'plain-dark.png'), contentType: 'image/png' },
	{ id: 'soft-gradient', file: path.join(__dirname, 'presets', 'soft-gradient.jpg'), contentType: 'image/jpeg' },
];

module.exports = { model, presets };
