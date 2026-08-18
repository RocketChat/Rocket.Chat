const PREVIEWABLE_IMAGE_MIMES = new Set([
	'image/apng',
	'image/avif',
	'image/bmp',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/webp',
]);

export const isPreviewableImage = (mimeType: string): boolean => PREVIEWABLE_IMAGE_MIMES.has(mimeType.toLowerCase());
