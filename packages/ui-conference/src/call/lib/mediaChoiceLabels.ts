import type { BlurLevel, BlurModel, NoiseMethod, VideoQuality } from '../../hooks/useCallDevicesInitialState';

/** Named by what they give you, weakest first. */
export const NOISE_METHOD_LABELS: Record<NoiseMethod, string> = {
	none: 'Noise_cancellation_off',
	browser: 'Noise_cancellation_standard',
	rnnoise: 'Noise_cancellation_rnnoise',
};

export const NOISE_METHOD_NOTES: Partial<Record<NoiseMethod, string>> = {
	rnnoise: 'Noise_cancellation_on_this_device',
};

export const VIDEO_QUALITY_LABELS: Record<VideoQuality, string> = {
	auto: 'Video_quality_auto',
	h1080: 'Video_quality_1080p',
	h720: 'Video_quality_720p',
	h360: 'Video_quality_360p',
	h180: 'Video_quality_180p',
};

export const BLUR_LEVEL_LABELS: Record<BlurLevel, string> = {
	none: 'Background_blur_none',
	light: 'Background_blur_light',
	medium: 'Background_blur_medium',
	strong: 'Background_blur_strong',
};

export const BLUR_MODEL_LABELS: Record<BlurModel, string> = {
	quality: 'Background_blur_model_quality',
	performance: 'Background_blur_model_performance',
};

/** Every choice a label map names, in the order it names them. */
export const choicesOf = <K extends string>(labels: Record<K, string>): K[] => Object.keys(labels) as K[];
