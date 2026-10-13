import type { SegmenterModelKey } from './backgroundBlurProcessor';

/** Where the processors fetch their runtime files from. The caller serves them; nothing here assumes a path. */
export type MediaProcessorAssets = {
	/** The classic worker that runs MediaPipe segmentation off the main thread: this package's `assets/background-blur-worker.js`. */
	workerUrl: string;
	/** MediaPipe's `vision_bundle.mjs`, which the worker imports. */
	visionBundleUrl: string;
	/** The directory holding MediaPipe's WASM runtime, matching the `@mediapipe/tasks-vision` version installed. */
	wasmBaseUrl: string;
	/** One segmentation model per choice the user can make. */
	modelUrls: Record<SegmenterModelKey, string>;
	/** The directory holding `rnnoise-worklet.js`, `rnnoise.wasm` and `rnnoise_simd.wasm`. */
	rnnoiseBaseUrl: string;
};
