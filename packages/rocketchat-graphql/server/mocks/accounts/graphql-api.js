export const authenticated = (Accounts, func) => (async(root, args, context, info) => {
	const userObject = await Accounts.resumeSession();

	if (userObject === null) {
		throw new Error('Invalid or expired token!');
	}

	return await func(root, args, Object.assign(context, { user: userObject }), info);
});
