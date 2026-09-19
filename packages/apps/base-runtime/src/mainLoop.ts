import process from 'node:process';

import { JsonRpcError, type SuccessObject } from 'jsonrpc-lite';

import apiHandler from './handlers/api-handler';
import handleApp from './handlers/app/handler';
import outboundMessageHandler from './handlers/outboundcomms-handler';
import handleScheduler from './handlers/scheduler-handler';
import slashcommandHandler from './handlers/slashcommand-handler';
import videoConferenceHandler from './handlers/videoconference-handler';
import { Logger } from './lib/logger';
import * as Messenger from './lib/messenger';
import { sendMetrics } from './lib/metricsCollector';
import type { RequestContext } from './lib/requestContext';
import { applySecureFieldsDeep } from './lib/secureFields';

type Handlers = {
	app: typeof handleApp;
	api: typeof apiHandler;
	slashcommand: typeof slashcommandHandler;
	videoconference: typeof videoConferenceHandler;
	outboundCommunication: typeof outboundMessageHandler;
	scheduler: typeof handleScheduler;
	ping: (request: RequestContext) => Promise<'pong'>;
};

const COMMAND_PING = '_zPING';

async function requestRouter({ type, payload }: Messenger.JsonRpcRequest): Promise<void> {
	const methodHandlers: Handlers = {
		app: handleApp,
		api: apiHandler,
		slashcommand: slashcommandHandler,
		videoconference: videoConferenceHandler,
		outboundCommunication: outboundMessageHandler,
		scheduler: handleScheduler,
		ping: (_request) => Promise.resolve('pong'),
	};

	// We're not handling notifications at the moment
	if (type === 'notification') {
		return Messenger.sendInvalidRequestError();
	}

	const { id, method } = payload;

	const logger = new Logger(method);

	const context: RequestContext = Object.assign(payload, {
		context: { logger },
	});

	const [methodPrefix] = method.split(':') as [keyof Handlers];
	const handler = methodHandlers[methodPrefix];

	if (!handler) {
		return Messenger.errorResponse(
			{
				error: { message: 'Method not found', code: -32601 },
				id,
			},
			context,
		);
	}

	const result = await handler(context).catch((reason) =>
		JsonRpcError.internalError({ cause: reason instanceof Error ? reason.toString() : reason }),
	);

	if (result instanceof JsonRpcError) {
		return Messenger.errorResponse({ id, error: result }, context);
	}

	return Messenger.successResponse({ id, result }, context);
}

function handleResponse(response: Messenger.JsonRpcResponse): void {
	let payload: { error: Error } | { detail: SuccessObject };

	if (Messenger.isErrorResponse(response.payload)) {
		payload = { error: new Error(response.payload.error.message) };
	} else {
		payload = { detail: response.payload };
	}

	Messenger.RPCResponseObserver.emit(`response:${response.payload.id}`, payload);
}

async function handleIncomingMessage(message: unknown): Promise<void> {
	try {
		// Process PING command first as it is not JSON RPC
		if (message === COMMAND_PING) {
			void Messenger.pongResponse();
			sendMetrics();
			return;
		}

		const JSONRPCMessage = Messenger.parseMessage(applySecureFieldsDeep(message) as Record<string, unknown>);

		if (Messenger.isRequest(JSONRPCMessage)) {
			void requestRouter(JSONRPCMessage);
			return;
		}

		if (Messenger.isResponse(JSONRPCMessage)) {
			handleResponse(JSONRPCMessage);
		}
	} catch (error) {
		if (Messenger.isErrorResponse(error)) {
			await Messenger.errorResponse(error);
		} else {
			await Messenger.sendParseError();
		}
	}
}

/**
 * The platform-agnostic message loop shared by every runtime.
 *
 * Adapters are expected to wire up their platform seams — sandbox
 * `require`/globals, error listeners — during bootstrap and only then invoke
 * this loop. It receives messages from the host over the IPC channel and
 * dispatches them to the shared handlers.
 */
export function startMainLoop(): void {
	process.on('message', (message) => void handleIncomingMessage(message));

	// Without a connected IPC channel this process has no host to serve; exit
	// instead of lingering as an orphan when the host dies or disconnects
	process.on('disconnect', () => process.exit(0));

	// The host waits for this notification before sending any message
	Messenger.sendNotification({ method: 'ready', params: [] });
}
