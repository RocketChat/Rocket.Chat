import type { EventID, HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';

// `HomeserverEventSignatures` is a type alias, so it cannot be extended through declaration merging.
// Drop the override below once federation-sdk declares `redacts` on the redaction payload.
type PatchedHomeserverEventSignatures = Omit<HomeserverEventSignatures, 'homeserver.matrix.redaction'> & {
	'homeserver.matrix.redaction': HomeserverEventSignatures['homeserver.matrix.redaction'] & { redacts: EventID };
};

export function onHomeserverEvent<K extends keyof PatchedHomeserverEventSignatures>(
	event: K,
	handler: (payload: PatchedHomeserverEventSignatures[K]) => unknown,
): (() => void) | undefined {
	return federationSDK.eventEmitterService.on(event, handler as never);
}
