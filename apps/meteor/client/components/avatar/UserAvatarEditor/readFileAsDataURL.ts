export const readFileAsDataURL = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = (event) => {
			const result = event.target?.result;
			if (typeof result === 'string') {
				resolve(result);
				return;
			}
			reject(new Error('Failed to read file'));
		};
		reader.onerror = (event) => {
			reject(new Error(`Failed to read file: ${event}`));
		};
		reader.readAsDataURL(file);
	});
