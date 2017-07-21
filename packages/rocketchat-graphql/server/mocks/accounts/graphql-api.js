/*export const authenticated = (Accounts, func) => (async(root, args, context, info) => {
	const userObject = await Accounts.resumeSession();

	if (userObject === null) {
		throw new Error('Invalid or expired token!');
	}

	return await func(root, args, Object.assign(context, { user: userObject }), info);
});*/

// Same as here: https://github.com/js-accounts/graphql/blob/master/packages/graphql-api/src/utils/authenticated-resolver.js
// except code below works
// It might be like that because of async/await,
// maybe Promise is not wrapped with Fiber
// See: https://github.com/meteor/meteor/blob/a362e20a37547362b581fed52f7171d022e83b62/packages/promise/server.js
export const authenticated = (Accounts, func) => (async(root, args, context, info) => {
	const authToken = context.authToken;

	if (!authToken || authToken === '' || authToken === null) {
		throw new Error('Unable to find authorization token in request');
	}

	const userObject = await Accounts.resumeSession(authToken);

	if (userObject === null) {
		throw new Error('Invalid or expired token!');
	}

	return await func(root, args, Object.assign(context, { user: userObject }), info);
});
