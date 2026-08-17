import type { Defined } from 'jsonrpc-lite';
import { JsonRpcError } from 'jsonrpc-lite';

import handleConstructApp from './construct';
import handleGetStatus from './handleGetStatus';
import handleInitialize from './handleInitialize';
import handleOnDisable from './handleOnDisable';
import handleOnEnable from './handleOnEnable';
import handleOnInstall from './handleOnInstall';
import handleOnPreSettingUpdate from './handleOnPreSettingUpdate';
import handleOnSettingUpdated from './handleOnSettingUpdated';
import handleOnUninstall from './handleOnUninstall';
import handleOnUpdate from './handleOnUpdate';
import handleSetStatus from './handleSetStatus';
import handleUploadEvents, { uploadEvents } from './handleUploadEvents';
import type { RequestContext } from '../../lib/requestContext';
import { isOneOf } from '../lib/assertions';
import handleListener from '../listener/handler';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler';

export default async function handleApp(request: RequestContext): Promise<Defined | JsonRpcError> {
	const { method } = request;
	const { logger } = request.context;
	const [, appMethod] = method.split(':');

	try {
		// We don't want the getStatus method to generate logs, so we handle it separately
		if (appMethod === 'getStatus') {
			return await handleGetStatus();
		}

		logger.debug({ msg: `A method is being called...`, appMethod });

		const formatResult = (result: Defined | JsonRpcError): Defined | JsonRpcError => {
			if (result instanceof JsonRpcError) {
				logger.debug({
					msg: `'${appMethod}' was unsuccessful.`,
					appMethod,
					err: result,
					errorMessage: result.message,
				});
			} else {
				logger.debug({
					msg: `'${appMethod}' was successfully called! The result is:`,
					appMethod,
					result,
				});
			}

			return result;
		};

		let result: Promise<Defined | JsonRpcError> | undefined = undefined;

		if (isOneOf(appMethod, uploadEvents)) {
			result = handleUploadEvents(request);
		} else if (isOneOf(appMethod, uikitInteractions)) {
			result = handleUIKitInteraction(request);
		} else if (appMethod.startsWith('check') || appMethod.startsWith('execute')) {
			result = handleListener(request);
		}

		switch (appMethod) {
			case 'construct':
				result = handleConstructApp(request);
				break;
			case 'initialize':
				result = handleInitialize(request);
				break;
			case 'setStatus':
				result = handleSetStatus(request);
				break;
			case 'onEnable':
				result = handleOnEnable(request);
				break;
			case 'onDisable':
				result = handleOnDisable(request);
				break;
			case 'onInstall':
				result = handleOnInstall(request);
				break;
			case 'onUninstall':
				result = handleOnUninstall(request);
				break;
			case 'onPreSettingUpdate':
				result = handleOnPreSettingUpdate(request);
				break;
			case 'onSettingUpdated':
				result = handleOnSettingUpdated(request);
				break;
			case 'onUpdate':
				result = handleOnUpdate(request);
				break;
		}

		if (typeof result === 'undefined') {
			throw new JsonRpcError(`Unknown method "${appMethod}"`, -32601);
		}

		return await result.then(formatResult);
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
