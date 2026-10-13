import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import { useMemo } from 'react';

import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

/**
 * Where this workspace serves the background blur and noise suppression files, models included, under its root path.
 *
 * Same-origin paths rather than the CDN or the site URL: a worker can only be started from the page's own origin.
 */
export const useMediaProcessorAssets = (): MediaProcessorAssets =>
	useMemo(() => {
		const assetsUrl = `${trimTrailingSlashes(getRootUrlPathPrefix())}/video-conference/assets`;

		return {
			workerUrl: `${assetsUrl}/blur-worker.js`,
			visionBundleUrl: `${assetsUrl}/mediapipe/vision_bundle.mjs`,
			wasmBaseUrl: `${assetsUrl}/mediapipe/wasm`,
			modelUrls: {
				quality: `${assetsUrl}/models/selfie_multiclass_256x256.tflite`,
				performance: `${assetsUrl}/models/selfie_segmenter_landscape.tflite`,
			},
			rnnoiseBaseUrl: `${assetsUrl}/rnnoise`,
		};
	}, []);
