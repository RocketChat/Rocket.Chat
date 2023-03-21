import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

type DeprecationWarningParams<T> = {
	endpoint: string;
	versionWillBeRemoved?: string;
	response: T;
	warningMessage?: string | ((props: Omit<DeprecationWarningParams<T>, 'warningMessage'>) => string);
};
export function deprecationWarning<T>({
	endpoint,
	versionWillBeRemoved = '6.0',
	response,
	warningMessage = `The endpoint "${endpoint}" is deprecated and will be removed on version ${versionWillBeRemoved}`,
}: DeprecationWarningParams<T>): T {
	const warning = typeof warningMessage === 'function' ? warningMessage({ endpoint, versionWillBeRemoved, response }) : warningMessage;

	apiDeprecationLogger.warn(warning);
	if (process.env.NODE_ENV === 'development') {
		return {
			warning,
			...response,
		};
	}

	return response;
}
