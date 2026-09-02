import type { MediaCallCreatePatch } from '@rocket.chat/apps-engine/definition/mediaCalls';

/**
 * Contacts are the outcome of routing and of permission checks, so only features may be patched.
 *
 * `isEventResult` only recognizes the marker, so the payload under it is still whatever the app
 * sent over JSON-RPC: it has a type here, but nothing ever checked it. A patch that carries
 * nothing usable changes nothing, exactly like `pass`.
 */
export function getMediaCallCreatePatch(appId: string, patch: unknown): Partial<MediaCallCreatePatch> {
	if (typeof patch !== 'object' || patch === null) {
		console.warn(`App ${appId} returned a media call patch that is not an object: ${patch === null ? 'null' : typeof patch}`);
		return {};
	}

	const { features, ...rest } = patch as Partial<MediaCallCreatePatch>;
	const unsupported = Object.keys(rest);

	if (unsupported.length) {
		console.warn(`App ${appId} tried to patch unsupported media call properties: ${unsupported.join(', ')}`);
	}

	return Array.isArray(features) ? { features } : {};
}
