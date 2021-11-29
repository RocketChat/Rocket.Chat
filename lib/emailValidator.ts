export const validateEmail = (email: string, options: { style: string } = { style: 'basic' }): boolean => {
	const basicEmailRegex = /^.+@.+$/;
	const rfcEmailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	switch (options.style) {
		case 'basic':
			return basicEmailRegex.test(email);
		case 'rfc':
			return rfcEmailRegex.test(email);
		default:
			return basicEmailRegex.test(email);
	}
};
