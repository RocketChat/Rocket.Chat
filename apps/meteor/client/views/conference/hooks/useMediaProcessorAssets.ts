import type { MediaProcessorAssets } from '@rocket.chat/media-processors';

const MEDIA_PROCESSOR_ASSETS: MediaProcessorAssets = {
	workerUrl: '/mediapipe/background-blur-worker.js',
	wasmBaseUrl: '/mediapipe/wasm',
	modelUrls: {
		quality: '/mediapipe/selfie_multiclass_256x256.tflite',
		performance: '/mediapipe/selfie_segmenter_landscape.tflite',
	},
	rnnoiseBaseUrl: '/noise-suppressor',
};

/** Where this workspace serves the background blur and noise suppression runtime files. */
export const useMediaProcessorAssets = (): MediaProcessorAssets => MEDIA_PROCESSOR_ASSETS;
