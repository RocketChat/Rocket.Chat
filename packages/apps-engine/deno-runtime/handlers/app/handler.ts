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
import { isOneOf } from '../lib/assertions.ts';
import handleListener from '../listener/handler.ts';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler.ts';
import { RequestContext } from '../../lib/requestContext.ts';

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
