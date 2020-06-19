import { API } from '../api';

API.helperMethods.set('deprecationWarning', function _deprecationWarning({ endpoint, versionWillBeRemoved, response }) {
	const warningMessage = `The endpoint "${ endpoint }" is deprecated and will be removed after version ${ versionWillBeRemoved }`;
	console.warn(warningMessage);
	if (process.env.NODE_ENV === 'development') {
		return {
			warning: warningMessage,
			...response,
		};
	}

	return response;
});
