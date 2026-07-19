import { setHostTransport, type HostMessage } from '@rocket.chat/apps/base-runtime/dist/lib/messenger';
import type { IncomingTransport } from '@rocket.chat/apps/base-runtime/dist/mainLoop';

/**
 * The single ITC command name every message (in both directions) travels under.
 * Kept in sync with `WATT_MESSAGE_COMMAND` on the host side.
 */
const WATT_MESSAGE_COMMAND = 'apps-engine:message';

/**
 * Logical name of the runtime host as an ITC message target.
 */
const RUNTIME_TARGET = 'runtime';

/**
 * The subset of Watt's per-worker `globalThis.platformatic` API this runtime
 * relies on. Platformatic injects this object into every Worker Thread it runs;
 * it is the worker-side counterpart of the host's `sendCommandToApplication`
 * and worker-message events.
 *
 * This - together with the host's `wireRuntimeEvents` - is the single seam that
 * binds the Apps-Engine JSON-RPC channel to Watt's inter-thread communication.
 */
type PlatformaticMessaging = {
	// Send a message to another participant of the runtime (here, the host).
	send(target: string, command: string, message: unknown): Promise<void>;
	// Register a handler for a command sent by the host.
	handle(command: string, handler: (message: unknown) => unknown): void;
};

type PlatformaticWorkerGlobal = {
	messaging?: PlatformaticMessaging;
};

function getMessaging(): PlatformaticMessaging {
	const platformatic = (globalThis as unknown as { platformatic?: PlatformaticWorkerGlobal }).platformatic;

	if (!platformatic?.messaging) {
		throw new Error('Watt messaging API is not available on globalThis.platformatic - is this running inside a Watt worker?');
	}

	return platformatic.messaging;
}

/**
 * Installs the Watt worker transport and returns the matching incoming
 * transport for {@link startMainLoop}.
 *
 * - Outgoing (worker -> host): messages are sent to the runtime host, which
 *   forwards them to the app's {@link WattRuntimeController} through the
 *   `application:worker:message` event.
 * - Incoming (host -> worker): the host calls `sendCommandToApplication`, which
 *   is delivered to the handler registered here.
 */
export function installWattChannel(): IncomingTransport {
	const messaging = getMessaging();

	setHostTransport({
		send(message: HostMessage): Promise<void> {
			return messaging.send(RUNTIME_TARGET, WATT_MESSAGE_COMMAND, message);
		},
	});

	return {
		subscribe(handler: (message: unknown) => void): void {
			messaging.handle(WATT_MESSAGE_COMMAND, (message: unknown) => {
				handler(message);
			});
		},
		onDisconnect(handler: () => void): void {
			// Watt owns the worker lifecycle; when the host tears the worker down the
			// thread is terminated directly, so there is no separate disconnect event
			// to relay. Still forward a hard `close` command should the host send one.
			messaging.handle('close', () => handler());
		},
	};
}
