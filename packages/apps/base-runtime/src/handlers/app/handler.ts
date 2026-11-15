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
import { JsonRpcError, METHOD_NOT_FOUND, SERVER_ERROR, type Defined } from '../../lib/jsonrpc';
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
			throw new JsonRpcError(`Unknown method "${appMethod}"`, METHOD_NOT_FOUND);
		}

		return await result.then(formatResult);
	} catch (e: unknown) {
		// `JsonRpcError` is deliberately not an `Error` subclass (see `lib/jsonrpc.ts`), so
		// it has to be recognized before the native `Error` check below. Without this branch
		// the `METHOD_NOT_FOUND` thrown above falls through to `SERVER_ERROR` and loses its
		// code, which the host branches on. Every sub-handler catches its own errors today,
		// so this branch also keeps the code of any payload one of them starts to reject with.
		if (e instanceof JsonRpcError) {
			return e;
		}

		if (!(e instanceof Error)) {
			return new JsonRpcError('Unknown error', SERVER_ERROR, e);
		}

		if ((e.cause as string)?.includes('invalid_param_type')) {
			return JsonRpcError.invalidParams(null);
		}

		if ((e.cause as string)?.includes('invalid_app')) {
			return JsonRpcError.internalError({ message: 'App unavailable' });
		}

		return new JsonRpcError(e.message, SERVER_ERROR, e);
	}
}
