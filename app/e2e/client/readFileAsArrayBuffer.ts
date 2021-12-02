export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (): void => {
			if (reader.result instanceof ArrayBuffer) {
				resolve(reader.result);
			}

			reject(new Error('invalid output'));
		};

		reader.onerror = (): void => {
			reject(reader.error);
		};

		reader.readAsArrayBuffer(file);
	});
