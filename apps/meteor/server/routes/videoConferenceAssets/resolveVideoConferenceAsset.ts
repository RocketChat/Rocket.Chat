import path from 'node:path';

/** The installed package directories the assets are read from. */
export type VideoConferenceAssetRoots = {
	mediapipe: string;
	rnnoise: string;
	mediaProcessors: string;
};

const JAVASCRIPT = 'text/javascript';
const WASM = 'application/wasm';

/** Every file the route serves, by its path under the route, and where it lives in its package. */
const ASSETS = new Map<string, { root: keyof VideoConferenceAssetRoots; file: string; contentType: string }>(
	Object.entries({
		'mediapipe/vision_bundle.mjs': { root: 'mediapipe', file: 'vision_bundle.mjs', contentType: JAVASCRIPT },
		'mediapipe/wasm/vision_wasm_internal.js': { root: 'mediapipe', file: 'wasm/vision_wasm_internal.js', contentType: JAVASCRIPT },
		'mediapipe/wasm/vision_wasm_internal.wasm': { root: 'mediapipe', file: 'wasm/vision_wasm_internal.wasm', contentType: WASM },
		'mediapipe/wasm/vision_wasm_nosimd_internal.js': {
			root: 'mediapipe',
			file: 'wasm/vision_wasm_nosimd_internal.js',
			contentType: JAVASCRIPT,
		},
		'mediapipe/wasm/vision_wasm_nosimd_internal.wasm': {
			root: 'mediapipe',
			file: 'wasm/vision_wasm_nosimd_internal.wasm',
			contentType: WASM,
		},
		'rnnoise/rnnoise-worklet.js': { root: 'rnnoise', file: 'rnnoise/workletProcessor.js', contentType: JAVASCRIPT },
		'rnnoise/rnnoise.wasm': { root: 'rnnoise', file: 'rnnoise.wasm', contentType: WASM },
		'rnnoise/rnnoise_simd.wasm': { root: 'rnnoise', file: 'rnnoise_simd.wasm', contentType: WASM },
		'blur-worker.js': { root: 'mediaProcessors', file: 'assets/background-blur-worker.js', contentType: JAVASCRIPT },
	}),
);

/**
 * The file on disk for a path under `/video-conference/assets/`, or `undefined` for anything not on the list —
 * so a request can never reach outside the files named above.
 */
export const resolveVideoConferenceAsset = (
	roots: VideoConferenceAssetRoots,
	requestPath: string,
): { filePath: string; contentType: string } | undefined => {
	const relativePath = requestPath.replace(/^\/+/, '');
	if (relativePath.split(/[/\\]/).includes('..')) {
		return undefined;
	}

	const asset = ASSETS.get(relativePath);
	if (!asset) {
		return undefined;
	}

	const root = path.resolve(roots[asset.root]);
	const filePath = path.resolve(root, asset.file);
	if (!filePath.startsWith(`${root}${path.sep}`)) {
		return undefined;
	}

	return { filePath, contentType: asset.contentType };
};
