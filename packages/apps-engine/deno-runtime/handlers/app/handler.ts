import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import { Defined, JsonRpcError } from 'jsonrpc-lite';

import handleConstructApp from './construct.ts';
import handleInitialize from './handleInitialize.ts';
import handleGetStatus from './handleGetStatus.ts';
import handleSetStatus from './handleSetStatus.ts';
import handleOnEnable from './handleOnEnable.ts';
import handleOnInstall from './handleOnInstall.ts';
import handleOnDisable from './handleOnDisable.ts';
import handleOnUninstall from './handleOnUninstall.ts';
import handleOnPreSettingUpdate from './handleOnPreSettingUpdate.ts';
import handleOnSettingUpdated from './handleOnSettingUpdated.ts';
import handleOnUpdate from './handleOnUpdate.ts';
import handleUploadEvents, { uploadEvents } from './handleUploadEvents.ts';
import handleListener from '../listener/handler.ts';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler.ts';
import { isOneOf } from '../lib/assertions.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { RequestContext } from '../../lib/requestContext.ts';

export default async function handleApp(request: RequestContext): Promise<Defined | JsonRpcError> {
	const { method } = request;
	const [, appMethod] = method.split(':');

	try {
		// We don't want the getStatus method to generate logs, so we handle it separately
		if (appMethod === 'getStatus') {
			return await handleGetStatus();
		}

		// `app` will be undefined if the method here is "app:construct"
		const app = AppObjectRegistry.get<App>('app');

		app?.getLogger().debug({ msg: `A method is being called...`, appMethod });

		const formatResult = (result: Defined | JsonRpcError): Defined | JsonRpcError => {
			if (result instanceof JsonRpcError) {
				app?.getLogger().debug({
					msg: `'${appMethod}' was unsuccessful.`,
					appMethod,
					err: result,
					errorMessage: result.message,
				});
			} else {
				app?.getLogger().debug({
					msg: `'${appMethod}' was successfully called! The result is:`,
					appMethod,
					result,
				});
			}

			return result;
		};

		if (app && isOneOf(appMethod, uploadEvents)) {
			return handleUploadEvents(request).then(formatResult);
		}

		if (app && isOneOf(appMethod, uikitInteractions)) {
			return handleUIKitInteraction(request).then(formatResult);
		}

		if (app && (appMethod.startsWith('check') || appMethod.startsWith('execute'))) {
			return handleListener(request).then(formatResult);
		}

		let result: Defined | JsonRpcError;

		switch (appMethod) {
			case 'construct':
				result = await handleConstructApp(request);
				break;
			case 'initialize':
				result = await handleInitialize(request);
				break;
			case 'setStatus':
				result = await handleSetStatus(request);
				break;
			case 'onEnable':
				result = await handleOnEnable(request);
				break;
			case 'onDisable':
				result = await handleOnDisable(request);
				break;
			case 'onInstall':
				result = await handleOnInstall(request);
				break;
			case 'onUninstall':
				result = await handleOnUninstall(request);
				break;
			case 'onPreSettingUpdate':
				result = await handleOnPreSettingUpdate(request);
				break;
			case 'onSettingUpdated':
				result = await handleOnSettingUpdated(request);
				break;
			case 'onUpdate':
				result = await handleOnUpdate(request);
				break;
			default:
				throw new JsonRpcError('Method not found', -32601);
		}

		app?.getLogger().debug({
			msg: `'${appMethod}' was successfully called! The result is:`,
			appMethod,
			result,
		});

		return result;
	} catch (e: unknown) {
		if (!(e instanceof Error)) {
			return new JsonRpcError('Unknown error', -32000, e);
		}

		if ((e.cause as string)?.includes('invalid_param_type')) {
			return JsonRpcError.invalidParams(null);
		}

		if ((e.cause as string)?.includes('invalid_app')) {
			return JsonRpcError.internalError({ message: 'App unavailable' });
		}

		return new JsonRpcError(e.message, -32000, e);
	}
}
