import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useMediaProcessorAssets } from './useMediaProcessorAssets';

afterEach(() => {
	delete (globalThis as { __meteor_runtime_config__?: unknown }).__meteor_runtime_config__;
});

it('serves the runtime under the workspace root path and the models from MediaPipe by default', () => {
	(globalThis as { __meteor_runtime_config__?: unknown }).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/chat/' };

	const { result } = renderHook(() => useMediaProcessorAssets(), { wrapper: mockAppRoot().build() });

	expect(result.current.workerUrl).toBe('/chat/video-conference/assets/blur-worker.js');
	expect(result.current.wasmBaseUrl).toBe('/chat/video-conference/assets/mediapipe/wasm');
	expect(result.current.rnnoiseBaseUrl).toBe('/chat/video-conference/assets/rnnoise');
	expect(result.current.modelUrls.quality).toMatch(/^https:\/\/storage\.googleapis\.com\/.+\/selfie_multiclass_256x256\.tflite$/);
});

it('takes the models from the base URL an admin set', () => {
	const { result } = renderHook(() => useMediaProcessorAssets(), {
		wrapper: mockAppRoot().withSetting('VideoConf_Background_Blur_Model_Url', 'https://models.example.com/blur/').build(),
	});

	expect(result.current.workerUrl).toBe('/video-conference/assets/blur-worker.js');
	expect(result.current.modelUrls).toEqual({
		quality: 'https://models.example.com/blur/selfie_multiclass_256x256.tflite',
		performance: 'https://models.example.com/blur/selfie_segmenter_landscape.tflite',
	});
});
