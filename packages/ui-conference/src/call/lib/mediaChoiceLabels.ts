import type { VideoQuality } from '../../hooks/useCallDevicesInitialState';

export const VIDEO_QUALITY_LABELS: Record<VideoQuality, string> = {
	auto: 'Video_quality_auto',
	h1080: 'Video_quality_1080p',
	h720: 'Video_quality_720p',
	h360: 'Video_quality_360p',
	h180: 'Video_quality_180p',
};

/** Every choice a label map names, in the order it names them. */
export const choicesOf = <K extends string>(labels: Record<K, string>): K[] => Object.keys(labels) as K[];
