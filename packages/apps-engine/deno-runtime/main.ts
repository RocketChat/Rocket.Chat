if (!Deno.args.includes('--subprocess')) {
    Deno.stderr.writeSync(
        new TextEncoder().encode(`
            This is a Deno wrapper for Rocket.Chat Apps. It is not meant to be executed stand-alone;
            It is instead meant to be executed as a subprocess by the Apps-Engine framework.
       `),
    );
    Deno.exit(1001);
}

import { JsonRpcError } from 'jsonrpc-lite';
import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import * as Messenger from './lib/messenger.ts';
import { decoder } from './lib/codec.ts';
import { AppObjectRegistry } from './AppObjectRegistry.ts';
import { Logger } from './lib/logger.ts';

import slashcommandHandler from './handlers/slashcommand-handler.ts';
import videoConferenceHandler from './handlers/videoconference-handler.ts';
import apiHandler from './handlers/api-handler.ts';
import handleApp from './handlers/app/handler.ts';
import handleScheduler from './handlers/scheduler-handler.ts';
import registerErrorListeners from './error-handlers.ts';
import { sendMetrics } from './lib/metricsCollector.ts';

type Handlers = {
    app: typeof handleApp;
    api: typeof apiHandler;
    slashcommand: typeof slashcommandHandler;
    videoconference: typeof videoConferenceHandler;
    scheduler: typeof handleScheduler;
    ping: (method: string, params: unknown) => 'pong';
};

const COMMAND_PING = '_zPING';

async function requestRouter({ type, payload }: Messenger.JsonRpcRequest): Promise<void> {
    const methodHandlers: Handlers = {
        app: handleApp,
        api: apiHandler,
        slashcommand: slashcommandHandler,
        videoconference: videoConferenceHandler,
        scheduler: handleScheduler,
        ping: (_method, _params) => 'pong',
    };

    // We're not handling notifications at the moment
    if (type === 'notification') {
        return Messenger.sendInvalidRequestError();
    }

    const { id, method, params } = payload;

    const logger = new Logger(method);
    AppObjectRegistry.set('logger', logger);

    const app = AppObjectRegistry.get<App>('app');

    if (app) {
        // Same logic as applied in the ProxiedApp class previously
        (app as unknown as Record<string, unknown>).logger = logger;
    }

    const [methodPrefix] = method.split(':') as [keyof Handlers];
    const handler = methodHandlers[methodPrefix];

    if (!handler) {
        return Messenger.errorResponse({
            error: { message: 'Method not found', code: -32601 },
            id,
        });
    }

    const result = await handler(method, params);

    if (result instanceof JsonRpcError) {
        return Messenger.errorResponse({ id, error: result });
    }

    return Messenger.successResponse({ id, result });
}

function handleResponse(response: Messenger.JsonRpcResponse): void {
    let event: Event;

    if (response.type === 'error') {
        event = new ErrorEvent(`response:${response.payload.id}`, {
            error: response.payload,
        });
    } else {
        event = new CustomEvent(`response:${response.payload.id}`, {
            detail: response.payload,
        });
    }

    Messenger.RPCResponseObserver.dispatchEvent(event);
}

async function main() {
    Messenger.sendNotification({ method: 'ready' });

    for await (const message of decoder.decodeStream(Deno.stdin.readable)) {
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

registerErrorListeners();

main();
