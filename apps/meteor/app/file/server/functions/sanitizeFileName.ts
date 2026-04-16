import path from 'path';

export function sanitizeFileName(fileName: string) {
	const base = path.basename(fileName);

	if (base !== fileName) {
		throw new Error('error-invalid-file-name');
	}

	if (base === '.' || base.startsWith('..')) {
		throw new Error('error-invalid-file-name');
	}

	if (!/^[a-zA-Z0-9._-]+$/.test(base)) {
		throw new Error('error-invalid-characters-in-file-name');
	}

	return base;
}
