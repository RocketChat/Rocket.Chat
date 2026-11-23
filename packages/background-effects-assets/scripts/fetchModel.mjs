// Fetches the pinned segmentation model into `dist/`, failing on any other file. Downloads are cached outside the package.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = (await import('node:module')).createRequire(import.meta.url);
const { model } = require('../index.js');

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cacheDir = process.env.BACKGROUND_EFFECTS_CACHE_DIR || path.join(homedir(), '.cache', 'rocketchat-background-effects');
const cached = path.join(cacheDir, `${model.sha256}.tflite`);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const fromCache = async () => {
	const bytes = await readFile(cached).catch(() => undefined);
	return bytes && sha256(bytes) === model.sha256 ? bytes : undefined;
};

const download = async () => {
	const response = await fetch(MODEL_URL);
	if (!response.ok) {
		throw new Error(`${model.name}: download failed with HTTP ${response.status} from ${MODEL_URL}`);
	}
	const bytes = Buffer.from(await response.arrayBuffer());
	const digest = sha256(bytes);
	if (digest !== model.sha256) {
		throw new Error(`${model.name}: SHA-256 ${digest} does not match the pinned ${model.sha256}`);
	}
	await mkdir(cacheDir, { recursive: true });
	await writeFile(cached, bytes);
	return bytes;
};

try {
	const bytes = (await fromCache()) ?? (await download());
	await mkdir(path.join(packageDir, 'dist'), { recursive: true });
	await writeFile(model.file, bytes);
	console.log(`${model.name}: ${bytes.length} bytes, SHA-256 verified`);
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}
