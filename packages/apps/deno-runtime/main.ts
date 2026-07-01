import process from 'node:process';

import { JsonRpcError, type SuccessObject } from 'jsonrpc-lite';

import * as Messenger from './lib/messenger';
import { stdoutTransport } from './lib/transports/stdoutTransport';
import { decoder } from './lib/codec';
import { Logger } from './lib/logger';

import slashcommandHandler from './handlers/slashcommand-handler';
import videoConferenceHandler from './handlers/videoconference-handler';
import apiHandler from './handlers/api-handler';
import handleApp from './handlers/app/handler';
import handleScheduler from './handlers/scheduler-handler';
import registerErrorListeners from './error-handlers';
import { sendMetrics } from './lib/metricsCollector';
import outboundMessageHandler from './handlers/outboundcomms-handler';
import { RequestContext } from './lib/requestContext';

if (!process.argv.includes('--subprocess')) {
	process.stderr.write(`
            This is a Deno wrapper for Rocket.Chat Apps. It is not meant to be executed stand-alone;
            It is instead meant to be executed as a subprocess by the Apps-Engine framework.
       `);
	process.exit(1001);
}

type Handlers = {
	app: typeof handleApp;
	api: typeof apiHandler;
	slashcommand: typeof slashcommandHandler;
	videoconference: typeof videoConferenceHandler;
	outboundCommunication: typeof outboundMessageHandler;
	scheduler: typeof handleScheduler;
	ping: (request: RequestContext) => 'pong';
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
		ping: (_request) => 'pong',
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

	const result = await handler(context);

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

async function main() {
	Messenger.sendNotification({ method: 'ready' });

	for await (const message of decoder.decodeStream(process.stdin)) {
		try {
			// Process PING command first as it is not JSON RPC
			if (message === COMMAND_PING) {
				void Messenger.pongResponse();
				void sendMetrics();
				continue;
			}

			const JSONRPCMessage = Messenger.parseMessage(message as Record<string, unknown>);

			if (Messenger.isRequest(JSONRPCMessage)) {
				void requestRouter(JSONRPCMessage);
				continue;
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
}

// This runtime communicates with the Apps-Engine host through stdout
Messenger.setTransport(stdoutTransport);

registerErrorListeners();

main();
