/**
 * Whether this browser can blur a camera background the way {@link BackgroundBlurProcessor} does it.
 *
 * Its own file, away from the processor, because this is the question a menu asks before anyone has chosen anything:
 * importing the processor to ask would fetch MediaPipe for a call that may never blur. Nothing here downloads.
 *
 * Every one of these fails quietly rather than throwing, which is why each is asked rather than assumed. The custom
 * compositor and MediaPipe GPU delegate both require WebGL2, segmentation runs in a worker over transferable
 * ImageBitmaps, and the result must be capturable as a video track.
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
