export const validateEmail = (email: string, options: { style: string } = { style: 'basic' }): boolean => {
	// Trim whitespace from the input
	const trimmedEmail = email.trim();

	// Basic regex (updated to check for a valid domain after the "@" symbol)
	const basicEmailRegex = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;

	//  regex (covers most common cases( empty string or null/undefined values))
	const rfcEmailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

	switch (options.style) {
		case 'rfc':
			return rfcEmailRegex.test(trimmedEmail);
		case 'basic':
		default:
			return basicEmailRegex.test(trimmedEmail);
	}
};
