const BACKGROUND_IMAGE_MAX_SIDE = 2560;

const encode = async (bitmap: ImageBitmap, width: number, height: number): Promise<Blob> => {
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(width, height);
		canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
		return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
	return new Promise<Blob>((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture could not be encoded'))), 'image/jpeg', 0.92),
	);
};

/** Decodes and downsizes a picture for use as a background; rejects a file that is not an image. */
export const prepareBackgroundImage = async (file: File): Promise<Blob> => {
	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(1, BACKGROUND_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
		return await encode(bitmap, Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)));
	} finally {
		bitmap.close();
	}
};
