import type { App } from '@rocket.chat/apps-engine/definition/App.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';
import { AppAccessorsInstance } from '../../lib/accessors/mod.js';
import type { RequestContext } from '../../lib/requestContext.js';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.js';

export default async function handleInitialize(request: RequestContext): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.initialize !== 'function') {
		throw new Error('App must contain an initialize function', {
			cause: 'invalid_app',
		});
	}

	await app.initialize.call(
		wrapAppForRequest(app, request),
		AppAccessorsInstance.getConfigurationExtend(),
		AppAccessorsInstance.getEnvironmentRead(),
	);

	return true;
}
