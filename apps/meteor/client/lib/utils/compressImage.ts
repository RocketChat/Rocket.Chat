export const compressImage = async (file: File, quality = 0.7, maxWidth = 1920): Promise<File> => {
	if (!file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
		return file;
	}

	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target?.result as string;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let { width, height } = img;

				if (width > maxWidth) {
					height = Math.round((height * maxWidth) / width);
					width = maxWidth;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve(file);
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob || blob.size >= file.size) {
							resolve(file);
							return;
						}
						const compressedFile = new File([blob], file.name, {
							type: file.type || 'image/jpeg',
							lastModified: Date.now(),
						});
						resolve(compressedFile);
					},
					file.type || 'image/jpeg',
					quality,
				);
			};
			img.onerror = () => resolve(file);
		};
		reader.onerror = () => resolve(file);
	});
};
