import type { App } from '@rocket.chat/apps-engine/definition/App.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';
import { AppAccessorsInstance } from '../../lib/accessors/mod.js';
import type { RequestContext } from '../../lib/requestContext.js';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.js';

export default function handleOnPreSettingUpdate(request: RequestContext): Promise<object> {
	const { params } = request;
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onPreSettingUpdate !== 'function') {
		throw new Error('App must contain an onPreSettingUpdate function', {
			cause: 'invalid_app',
		});
	}

	if (!Array.isArray(params)) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [setting] = params as [Record<string, unknown>];

	// oxlint-disable-next-line typescript/no-unsafe-return -- Function.prototype.call returns any because strictBindCallApply is off in this package; the value is the app's onPreSettingUpdate result
	return app.onPreSettingUpdate.call(
		wrapAppForRequest(app, request),
		setting,
		AppAccessorsInstance.getConfigurationModify(),
		AppAccessorsInstance.getReader(),
		AppAccessorsInstance.getHttp(),
	);
}
