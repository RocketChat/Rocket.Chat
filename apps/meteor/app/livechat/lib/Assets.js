export const addServerUrlToIndex = (file) =>
	file.replace('<body>', `<body><script> SERVER_URL = '${__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '')}'; </script>`);
