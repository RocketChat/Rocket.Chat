import type { App } from '@rocket.chat/apps-engine/definition/App.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';
import { AppAccessorsInstance } from '../../lib/accessors/mod.js';
import type { RequestContext } from '../../lib/requestContext.js';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.js';

export default function handleOnEnable(request: RequestContext): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onEnable !== 'function') {
		throw new Error('App must contain an onEnable function', {
			cause: 'invalid_app',
		});
	}

	// oxlint-disable-next-line typescript/no-unsafe-return -- Function.prototype.call returns any because strictBindCallApply is off in this package; the value is the app's onEnable result
	return app.onEnable.call(
		wrapAppForRequest(app, request),
		AppAccessorsInstance.getEnvironmentRead(),
		AppAccessorsInstance.getConfigurationModify(),
	);
}
