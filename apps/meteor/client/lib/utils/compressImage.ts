export const isAnimatedImage = async (file: File): Promise<boolean> => {
	if (file.type.includes('gif') || file.type.includes('apng') || file.name.endsWith('.apng')) {
		return true;
	}

	try {
		const buffer = await file.slice(0, 4096).arrayBuffer();
		const bytes = new Uint8Array(buffer);

		const containsString = (str: string) => {
			for (let i = 0; i <= bytes.length - str.length; i++) {
				let match = true;
				for (let j = 0; j < str.length; j++) {
					if (bytes[i + j] !== str.charCodeAt(j)) {
						match = false;
						break;
					}
				}
				if (match) return true;
			}
			return false;
		};

		if (containsString('acTL') || containsString('ANIM') || containsString('ANMF')) {
			return true;
		}
	} catch {
		// Ignore slice read errors
	}

	return false;
};

export const compressImage = async (file: File, quality = 0.7, maxWidth = 1920): Promise<File> => {
	if (!file.type.startsWith('image/') || file.type.includes('svg')) {
		return file;
	}

	if (await isAnimatedImage(file)) {
		return file;
	}

	return new Promise((resolve) => {
		const objectUrl = URL.createObjectURL(file);
		const img = new Image();
		img.src = objectUrl;

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);
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
					if (!blob || blob.size >= file.size || (file.type && blob.type !== file.type)) {
						resolve(file);
						return;
					}
					const compressedFile = new File([blob], file.name, {
						type: blob.type,
						lastModified: Date.now(),
					});
					resolve(compressedFile);
				},
				file.type || 'image/jpeg',
				quality,
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(file);
		};
	});
};
