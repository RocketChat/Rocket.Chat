RocketChat.API.helperMethods.set('deprecationWarning', function _deprecationWarning({ endpoint, versionWillBeRemove, response }) {
	const warningMessage = `The endpoint "${ endpoint }" is deprecated and will be removed after version ${ versionWillBeRemove }`;
	console.warn(warningMessage);
	if (process.env.NODE_ENV === 'development') {
		response.warning = warningMessage;
	}

	return response;
});

