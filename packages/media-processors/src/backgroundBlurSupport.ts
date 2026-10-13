/**
 * Whether this browser can blur a camera background the way {@link BackgroundBlurProcessor} does it. Kept apart from
 * the processor so asking downloads nothing: importing the processor would fetch MediaPipe.
 *
 * Each capability is checked because each fails quietly rather than throwing when it is missing.
 */
export const supportsBackgroundBlur = (): boolean => {
	if (
		typeof document === 'undefined' ||
		typeof HTMLCanvasElement === 'undefined' ||
		typeof Worker === 'undefined' ||
		typeof OffscreenCanvas === 'undefined' ||
		typeof createImageBitmap !== 'function' ||
		!('captureStream' in HTMLCanvasElement.prototype)
	) {
		return false;
	}

	// MediaPipe's GPU delegate and the halo-free compositor want WebGL2. The CPU path cannot sustain call frame rates.
	return Boolean(document.createElement('canvas').getContext('webgl2'));
};
