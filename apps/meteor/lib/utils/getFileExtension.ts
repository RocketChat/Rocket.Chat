export const getFileExtension = (fileName?: string): string => {
	if (!fileName) {
		return 'file';
	}

	const arr = fileName.split('.');

	if (arr.length < 2 || (arr[0] === '' && arr.length === 2)) {
		return 'file';
	}

	return arr.pop()?.toLocaleUpperCase() || 'file';
};
