import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { RequestContext } from '../../lib/requestContext.ts';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.ts';

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
		AppAccessorsInstance.getEnvironmentRead()
	);

	return true;
}
