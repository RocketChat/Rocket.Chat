import path from 'node:path';

import { resolveInstalledFile, serveFiles } from '../lib/http/serveFiles';
import { resolvePrivateAsset } from '../lib/privateAssets';

const fromTasksVision = (file: string) => () => path.join(path.dirname(resolveInstalledFile('@mediapipe/tasks-vision')), 'wasm', file);

const fromPrivate = (file: string) => () => resolvePrivateAsset(`video-conference/${file}`);

/**
 * Serves the background-effects segmenter (MediaPipe's runtime and its model) to the conference window, so clients
 * never fetch it from a third party.
 */
serveFiles(
	'/video-conference/segmentation',
	new Map([
		['vision_wasm_internal.js', fromTasksVision('vision_wasm_internal.js')],
		['vision_wasm_internal.wasm', fromTasksVision('vision_wasm_internal.wasm')],
		['vision_wasm_nosimd_internal.js', fromTasksVision('vision_wasm_nosimd_internal.js')],
		['vision_wasm_nosimd_internal.wasm', fromTasksVision('vision_wasm_nosimd_internal.wasm')],
		['selfie_multiclass_256x256_fp16.tflite', fromPrivate('selfie_multiclass_256x256_fp16.tflite')],
	]),
);
