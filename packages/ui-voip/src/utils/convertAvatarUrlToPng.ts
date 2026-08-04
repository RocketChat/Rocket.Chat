export const convertAvatarUrlToPng = (avatarUrl: string | undefined): Promise<string> => {
	return new Promise((resolve) => {
		if (!avatarUrl) {
			resolve('');
			return;
		}

		const image = new Image();

		const onLoad = (): void => {
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const context = canvas.getContext('2d');

			if (!context) {
				resolve('');
				return;
			}

			context.drawImage(image, 0, 0);
			try {
				resolve(canvas.toDataURL('image/png'));
			} catch (e) {
				resolve('');
			}
		};

		const onError = (): void => resolve('');

		image.onload = onLoad;
		image.onerror = onError;
		image.crossOrigin = 'anonymous';
		image.src = avatarUrl;
	});
};
