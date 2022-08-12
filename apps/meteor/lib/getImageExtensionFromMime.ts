const extensionsMap: Record<string, string> = {
	'image/apng': 'apng',
	'image/avif': 'avif',
	'image/gif': 'gif',
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/svg+xml': 'svg',
	'image/webp': 'webp',
	'image/bmp': 'bmp',
	'image/x-icon': 'ico',
	'image/tiff': 'tif',
};

export const getImageExtensionFromMime = (mime: string): string | undefined => extensionsMap[mime];
