const unrenderableImageTypes = ['image/tiff', 'image/x-motion-jpeg', 'image/avs-video', 'image/pic'];

export const isRenderableImageType = (contentType?: string | null): boolean => {
	const type = (contentType || '').split(';')[0].trim().toLowerCase();
	return type.startsWith('image/') && !unrenderableImageTypes.includes(type);
};
