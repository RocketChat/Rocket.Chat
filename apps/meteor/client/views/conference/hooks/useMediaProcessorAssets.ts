import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';

const QUALITY_MODEL = 'selfie_multiclass_256x256.tflite';
const PERFORMANCE_MODEL = 'selfie_segmenter_landscape.tflite';

const OFFICIAL_MODEL_URLS: MediaProcessorAssets['modelUrls'] = {
	quality: `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/${QUALITY_MODEL}`,
	performance: `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/${PERFORMANCE_MODEL}`,
};

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

/**
 * Where this workspace serves the background blur and noise suppression runtime files, under its root path, and
 * where the segmentation models come from: the base URL an admin set, or MediaPipe's own storage.
 *
 * Same-origin paths rather than the CDN or the site URL: a worker can only be started from the page's own origin.
 */
export const useMediaProcessorAssets = (): MediaProcessorAssets => {
	const modelBaseUrl = trimTrailingSlashes(useSetting('VideoConf_Background_Blur_Model_Url', '').trim());

	return useMemo(() => {
		const assetsUrl = `${trimTrailingSlashes(getRootUrlPathPrefix())}/video-conference/assets`;

		return {
			workerUrl: `${assetsUrl}/blur-worker.js`,
			visionBundleUrl: `${assetsUrl}/mediapipe/vision_bundle.mjs`,
			wasmBaseUrl: `${assetsUrl}/mediapipe/wasm`,
			modelUrls: modelBaseUrl
				? { quality: `${modelBaseUrl}/${QUALITY_MODEL}`, performance: `${modelBaseUrl}/${PERFORMANCE_MODEL}` }
				: OFFICIAL_MODEL_URLS,
			rnnoiseBaseUrl: `${assetsUrl}/rnnoise`,
		};
	}, [modelBaseUrl]);
};
