import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { RequestContext } from '../../lib/requestContext.ts';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.ts';

export default function handleOnEnable(request: RequestContext): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onEnable !== 'function') {
		throw new Error('App must contain an onEnable function', {
			cause: 'invalid_app',
		});
	}

	return app.onEnable.call(
		wrapAppForRequest(app, request),
		AppAccessorsInstance.getEnvironmentRead(),
		AppAccessorsInstance.getConfigurationModify()
	);
}
