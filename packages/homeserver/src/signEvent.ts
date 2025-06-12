import type { EventBase } from './core/events/eventBase';
import type { SigningKey } from './keys';

export type SignedEvent<T extends EventBase> = T & {
	event_id: string;
	hashes: {
		sha256: string;
	};
	signatures: {
		[key: string]: {
			[key: string]: string;
		};
	};
};

export const signEvent = async <T extends EventBase>(
	event: T,
	signature: SigningKey,
	signingName: string,
): Promise<SignedEvent<T>> => {
	// Dynamically import dependencies to avoid circular dependencies
	const [{ computeAndMergeHash }, { pruneEventDict }] = await Promise.all([
		import('./authentication'),
		import('./pruneEventDict'),
	]);
	// Compute hash and sign
	const eventToSign = pruneEventDict(computeAndMergeHash(event));
	const { signJson } = await import('./signJson');
	const signedJsonResult = await signJson(eventToSign, signature, signingName);
	// For non-redaction events, restore the original content
	
	return {
		...signedJsonResult,
		content: event.content,
		unsigned: event.unsigned,
	} as SignedEvent<T>;
};
