export function isImagePreviewSupported(mimeType: string): boolean {
	// Only attempt preview generation for image types that can be processed by Sharp
	// This excludes vendor-specific formats like image/vnd.dwg that cannot be rendered
	const supportedTypes = new Set([
		'image/bmp',
		'image/x-windows-bmp',
		'image/jpeg',
		'image/pjpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/svg+xml',
	]);
	return supportedTypes.has(mimeType);
}
