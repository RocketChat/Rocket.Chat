export const isValidImageFormat = (dataURL: string): Promise<boolean> => {
	const img = new Image();
	return new Promise((resolve) => {
		img.onload = (): void => resolve(true);
		img.onerror = (): void => resolve(false);
		img.src = dataURL;
	});
};
