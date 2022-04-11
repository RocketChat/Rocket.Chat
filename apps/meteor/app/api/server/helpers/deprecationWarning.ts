import { API } from '../api';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

export function deprecationWarning<T>({
	endpoint,
	versionWillBeRemoved = '5.0',
	response,
}: {
	endpoint: string;
	versionWillBeRemoved?: string;
	response: T;
}): T {
	const warningMessage = `The endpoint "${endpoint}" is deprecated and will be removed after version ${versionWillBeRemoved}`;
	apiDeprecationLogger.warn(warningMessage);
	if (process.env.NODE_ENV === 'development') {
		return {
			warning: warningMessage,
			...response,
		};
	}

	return response;
}

API.helperMethods.set('deprecationWarning', deprecationWarning);
