export const fixFileUrl = (originalPath: string | undefined): string | undefined => {
	if (!originalPath) {
		return originalPath;
	}

	if (!originalPath.startsWith('http://') && !originalPath.startsWith('https://')) {
		return originalPath;
	}

	try {
		const originalUrl = new URL(originalPath);
		const currentServerUrl = window.location.origin;
		const fixedUrl = `${currentServerUrl}${originalUrl.pathname}${originalUrl.search}${originalUrl.hash}`;
		return fixedUrl;
	} catch (error) {
		const pathMatch = originalPath.match(/(\/file-upload\/.*|\/ufs\/.*|\/file-decrypt\/.*)$/);
		if (pathMatch) {
			return `${window.location.origin}${pathMatch[1]}`;
		}
		return originalPath;
	}
};