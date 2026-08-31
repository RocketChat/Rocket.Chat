export function isImagePreviewSupported(mimeType: string): boolean {
	// Only attempt preview generation for image types that can be processed by Sharp
	// This excludes vendor-specific formats like image/vnd.dwg that cannot be rendered
	return (
		mimeType === 'image/bmp' ||
		mimeType === 'image/x-windows-bmp' ||
		mimeType === 'image/jpeg' ||
		mimeType === 'image/pjpeg' ||
		mimeType === 'image/png' ||
		mimeType === 'image/gif' ||
		mimeType === 'image/webp' ||
		mimeType === 'image/svg+xml'
	);
}
