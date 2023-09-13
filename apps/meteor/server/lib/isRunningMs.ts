import type { EventSignatures } from '@rocket.chat/core-services';
import { api } from '@rocket.chat/core-services';

/**
 * Checks if the server is running in micro services mode
 * @returns {boolean}
 */
export function isRunningMs(): boolean {
	return !!process.env.TRANSPORTER?.match(/^(?:nats|TCP)/);
}

export const broadcastEventToServices = <T extends keyof EventSignatures>(
	event: T,
	...args: Parameters<EventSignatures[T]>
): Promise<void> => (isRunningMs() ? api.broadcast(event, ...args) : api.broadcastLocal(event, ...args));
