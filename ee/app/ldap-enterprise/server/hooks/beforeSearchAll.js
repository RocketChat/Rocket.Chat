export const beforeSearchAll = (searchParams) => {
	const { options } = searchParams;

	if (!Array.isArray(options.attributes)) {
		options.attributes = options.attributes ? [options.attributes] : ['*'];
	}

	options.attributes.push('pwdAccountLockedTime');

	return searchParams;
};
