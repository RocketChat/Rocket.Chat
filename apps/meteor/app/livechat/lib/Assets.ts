export const addServerUrlToIndex = (file: string): string => {
	const rootUrl = (global as any).__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '');
	return file.replace('<body>', `<body><script> SERVER_URL = '${rootUrl}'; </script>`);
};
