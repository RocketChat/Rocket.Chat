import type { App } from '@rocket.chat/apps-engine/definition/App';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessorsInstance } from '../../lib/accessors/mod';
import type { RequestContext } from '../../lib/requestContext';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest';

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
