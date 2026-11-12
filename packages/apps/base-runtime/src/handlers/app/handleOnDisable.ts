import type { App } from '@rocket.chat/apps-engine/definition/App.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';
import { AppAccessorsInstance } from '../../lib/accessors/mod.js';
import type { RequestContext } from '../../lib/requestContext.js';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.js';

export default async function handleOnDisable(request: RequestContext): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onDisable !== 'function') {
		throw new Error('App must contain an onDisable function', {
			cause: 'invalid_app',
		});
	}

	await app.onDisable.call(wrapAppForRequest(app, request), AppAccessorsInstance.getConfigurationModify());

	return true;
}
