export const validatePassword = (password: string): string => {
	const passwordRegex = /(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z])(?=.*[a-z]).{8,}/;

	if (!password) {
		return 'Password cannot be empty';
	}
	if (password.length < 8) {
		return 'Password must be 8 characters long';
	}
	if (!passwordRegex.test(password)) {
		return 'Invalid password. Must contain one number, one capital letter, one small letter and one special character (!@#$%^&*)';
	}
	return '';
};
