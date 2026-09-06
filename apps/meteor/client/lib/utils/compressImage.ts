export const isAnimatedImage = async (file: File): Promise<boolean> => {
	if (file.type.includes('gif')) {
		return true;
	}

	if (file.name.toLowerCase().endsWith('.apng')) {
		return true;
	}

	// 1. PNG / APNG chunk parser
	if (file.type.includes('png') || file.name.toLowerCase().endsWith('.png')) {
		try {
			let offset = 8; // PNG signature is 8 bytes
			while (offset < file.size) {
				const headerBuffer = await file.slice(offset, offset + 8).arrayBuffer();
				if (headerBuffer.byteLength < 8) {
					break;
				}

				const view = new DataView(headerBuffer);
				const length = view.getUint32(0); // big-endian
				const type = String.fromCharCode(
					view.getUint8(4),
					view.getUint8(5),
					view.getUint8(6),
					view.getUint8(7),
				);

				if (type === 'acTL') {
					return true;
				}
				if (type === 'IDAT' || type === 'IEND') {
					return false;
				}
				offset += 12 + length;
			}
		} catch {
			// Ignore read errors and fall through
		}
	}

	// 2. WebP chunk parser
	if (file.type.includes('webp') || file.name.toLowerCase().endsWith('.webp')) {
		try {
			const headerBuffer = await file.slice(0, 32).arrayBuffer();
			if (headerBuffer.byteLength >= 12) {
				const view = new DataView(headerBuffer);
				const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
				const webp = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));

				if (riff === 'RIFF' && webp === 'WEBP') {
					let offset = 12;
					while (offset < file.size) {
						const chunkHeaderBuffer = await file.slice(offset, offset + 8).arrayBuffer();
						if (chunkHeaderBuffer.byteLength < 8) {
							break;
						}

						const chunkView = new DataView(chunkHeaderBuffer);
						const type = String.fromCharCode(
							chunkView.getUint8(0),
							chunkView.getUint8(1),
							chunkView.getUint8(2),
							chunkView.getUint8(3),
						);
						const length = chunkView.getUint32(4, true); // little-endian

						if (type === 'ANIM' || type === 'ANMF') {
							return true;
						}
						if (type === 'VP8X') {
							const vp8xBuffer = await file.slice(offset, offset + 9).arrayBuffer();
							if (vp8xBuffer.byteLength >= 9) {
								const vp8xView = new DataView(vp8xBuffer);
								const flags = vp8xView.getUint8(8);
								if ((flags & 0x02) !== 0) {
									return true;
								}
							}
						}
						if (type === 'VP8 ' || type === 'VP8L') {
							return false;
						}
						offset += 8 + length + (length & 1);
					}
				}
			}
		} catch {
			// Ignore read errors and fall through
		}
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
