export const addServerUrlToIndex = (file: string): any =>
	file.replace(
		'<body>',
		`<body><script> SERVER_URL = '${(global as any).__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '')}'; </script>`,
	);
