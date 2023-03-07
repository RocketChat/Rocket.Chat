import { API } from '../api';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

export function deprecationWarning<T>({
	endpoint,
	versionWillBeRemoved = '6.0',
	response,
	warningMessage=`The endpoint "${endpoint}" is deprecated and will be removed after version ${versionWillBeRemoved}`;
}: {
	endpoint: string;
	versionWillBeRemoved?: string;
	response: T;
	warningMessage: string;
}): T {
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
