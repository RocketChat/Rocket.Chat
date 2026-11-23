import type { App } from '@rocket.chat/apps-engine/definition/App.js';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';
import type { RequestContext } from '../../lib/requestContext.js';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.js';

export default async function handleSetStatus(request: RequestContext): Promise<null> {
	const { params } = request;

	if (!Array.isArray(params) || !Object.values(AppStatus).includes(params[0])) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [status] = params as [typeof AppStatus];

	const app = AppObjectRegistry.get<App>('app');

	if (!app || typeof (app as unknown as Record<string, unknown>).setStatus !== 'function') {
		throw new Error('App must contain a setStatus function', {
			cause: 'invalid_app',
		});
	}

	await (app as unknown as { setStatus(status: typeof AppStatus): Promise<void> }).setStatus.call(wrapAppForRequest(app, request), status);

	return null;
}
