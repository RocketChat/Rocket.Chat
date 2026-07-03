import type { App } from '@rocket.chat/apps-engine/definition/App';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { RequestContext } from '../../lib/requestContext';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest';

export default async function handleSetStatus(request: RequestContext): Promise<null> {
	const { params } = request;

	if (!Array.isArray(params) || !Object.values(AppStatus).includes(params[0])) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [status] = params as [AppStatus];

	const app = AppObjectRegistry.get<App>('app');

	if (!app || typeof app['setStatus'] !== 'function') {
		throw new Error('App must contain a setStatus function', {
			cause: 'invalid_app',
		});
	}

	await app['setStatus'].call(wrapAppForRequest(app, request), status);

	return null;
}
