export const getImageDimensions = (file: File): Promise<{ height: number; width: number }> =>
	new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ height: img.height, width: img.width });
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load image for dimensions'));
		};
		img.src = url;
	});
