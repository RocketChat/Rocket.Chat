import { renderHook } from '@testing-library/react';

import { useMediaProcessorAssets } from './useMediaProcessorAssets';

afterEach(() => {
	delete (globalThis as { __meteor_runtime_config__?: unknown }).__meteor_runtime_config__;
});

it('serves the runtime and the models from this workspace, under its root path', () => {
	(globalThis as { __meteor_runtime_config__?: unknown }).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/chat/' };

	const { result } = renderHook(() => useMediaProcessorAssets());

	expect(result.current).toEqual({
		workerUrl: '/chat/video-conference/assets/blur-worker.js',
		visionBundleUrl: '/chat/video-conference/assets/mediapipe/vision_bundle.mjs',
		wasmBaseUrl: '/chat/video-conference/assets/mediapipe/wasm',
		modelUrls: {
			quality: '/chat/video-conference/assets/models/selfie_multiclass_256x256.tflite',
			performance: '/chat/video-conference/assets/models/selfie_segmenter_landscape.tflite',
		},
		rnnoiseBaseUrl: '/chat/video-conference/assets/rnnoise',
	});
});

it('serves from the site root when there is no path prefix', () => {
	const { result } = renderHook(() => useMediaProcessorAssets());

	expect(result.current.modelUrls.quality).toBe('/video-conference/assets/models/selfie_multiclass_256x256.tflite');
});
