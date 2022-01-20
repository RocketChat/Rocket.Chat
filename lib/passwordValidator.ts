export const validatePassword = (password: string): string => {
	let errorMessage = '';
	const passwordRegex = /(?=.*[0-9])/;

	if (!password) {
		errorMessage = 'Password cannot be empty';
	} else if (password.length < 8) {
		errorMessage = 'Password must be 8 characters long';
	} else if (!passwordRegex.test(password)) {
		errorMessage = 'Invalid password. Must contain one number';
	}
	return errorMessage;
};
