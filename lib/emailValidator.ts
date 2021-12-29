export const validateEmail = (email: string, options: { style: string } = { style: 'basic' }): boolean => {
	const basicEmailRegex = /^[^@]+@[^@]+$/;
	const rfcEmailRegex =
		/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	switch (options.style) {
		case 'rfc':
			return rfcEmailRegex.test(email);
		case 'basic':
		default:
			return basicEmailRegex.test(email);
	}
};
