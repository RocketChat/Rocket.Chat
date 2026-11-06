import type { NoiseMethod, VideoQuality } from '../../hooks/useCallDevicesInitialState';

export const VIDEO_QUALITY_LABELS: Record<VideoQuality, string> = {
	auto: 'Video_quality_auto',
	h1080: 'Video_quality_1080p',
	h720: 'Video_quality_720p',
	h360: 'Video_quality_360p',
	h180: 'Video_quality_180p',
};

/** Weakest first, which is the order the microphone menu offers them in. */
export const NOISE_METHOD_LABELS: Record<NoiseMethod, string> = {
	none: 'Noise_cancellation_off',
	browser: 'Noise_cancellation_standard',
	rnnoise: 'Noise_cancellation_advanced',
};

/** Every choice a label map names, in the order it names them. */
export const choicesOf = <K extends string>(labels: Record<K, string>): K[] => Object.keys(labels) as K[];
