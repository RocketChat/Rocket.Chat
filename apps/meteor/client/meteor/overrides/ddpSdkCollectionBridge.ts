import { Meteor } from 'meteor/meteor';

import { type DDPMessage, stringifyDDP } from '../../lib/sdk/ddpProtocol';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../../lib/sdk/sdkTransportEnabled';

/**
 * Bridge incoming DDPSDK frames into Meteor.connection's collection dispatch.
 *
 * Without this, routing Meteor.apply methods through DDPSDK would leave the
 * application in a broken state: Meteor-registered collections (Meteor.users,
 * every Mongo.Collection subscribers of the Meteor.connection publications,
 * etc.) only react to frames they receive on Meteor.connection's own socket.
 * A successful login via the DDPSDK socket pushes the current user document
 * and follow-up subscription payloads on that socket — not Meteor's — so the
 * Users Zustand store (exposed as Meteor.users through userAndUsers.ts)
 * never populates and useMainReady stays false.
 *
 * By tapping DDPSDK's MinimalDDPClient.onMessage, we selectively re-feed
 * collection-mutation, ready and nosub messages through
 * Meteor.connection._streamHandlers.onMessage, reusing Meteor's dispatch
 * logic for _stores without having to duplicate it.
 *
 * Method results / updated / heartbeat frames are NOT re-emitted — those are
 * already handled by either Meteor's own invokers (when the method went
 * through Meteor.connection) or by ddpOverSDK's processResult (when it went
 * through DDPSDK). Duplicating them would confuse Meteor's invoker state.
 */

type ParsedDdpFrame = { msg?: string; id?: unknown; methods?: unknown } & Record<string, unknown>;

const COLLECTION_FRAMES = new Set(['added', 'changed', 'removed', 'addedBefore', 'movedBefore']);
const SUBSCRIPTION_LIFECYCLE_FRAMES = new Set(['ready', 'nosub']);

// SDK-internal ids are 'rc-ddp-client-N'; Meteor's are numeric strings ('1',
// '2', ...). Method-result frames addressed to SDK-internal ids must NOT
// reach Meteor's _streamHandlers — Meteor's `updated` handler throws "No
// callback invoker for method ..." when the id is missing from
// _methodInvokers (document_processors.js:168). Filter those out at the
// bridge so SDK's own callAsync flows aren't surfaced into Meteor.
const isSdkInternalId = (id: unknown): boolean => typeof id === 'string' && id.startsWith('rc-ddp-client-');

const shouldBridgeToMeteor = (frame: ParsedDdpFrame): boolean => {
	if (!frame || typeof frame.msg !== 'string') return false;

	if (COLLECTION_FRAMES.has(frame.msg) || SUBSCRIPTION_LIFECYCLE_FRAMES.has(frame.msg)) {
		return true;
	}

	if (frame.msg === 'result') {
		return !isSdkInternalId(frame.id);
	}
	if (frame.msg === 'updated') {
		const methods = Array.isArray(frame.methods) ? (frame.methods as unknown[]) : [];
		// If any of the methodIds in the `updated` frame is SDK-internal, drop
		// the whole frame: Meteor processes every id and would throw on the
		// first miss. In practice an `updated` frame carries ids from a single
		// originating method call, so this is all-or-nothing anyway.
		return methods.length > 0 && !methods.some(isSdkInternalId);
	}

	return false;
};

const pendingMeteorLogins = new Set<string>();
const withheldMeteorLogins = new Set<string>();

export const trackMeteorLogin = (id: string): void => {
	pendingMeteorLogins.add(id);
};

/**
 * Meteor logs the user out on any failed login, but a 500 only means the server could not complete it
 * (e.g. the account service is unavailable mid-rollout), not that the token is bad. Such results are
 * kept from Meteor and the socket is dropped, so Meteor resends the login once the SDK reconnects.
 */
const withholdRetryableLoginFailure = (frame: ParsedDdpFrame): boolean => {
	if (frame.msg === 'updated') {
		const methods = Array.isArray(frame.methods) ? (frame.methods as unknown[]) : [];
		return methods.filter((id) => typeof id === 'string' && withheldMeteorLogins.delete(id)).length > 0;
	}

	if (frame.msg !== 'result' || typeof frame.id !== 'string' || !pendingMeteorLogins.delete(frame.id)) return false;
	if ((frame.error as { error?: unknown } | undefined)?.error !== 500) return false;

	withheldMeteorLogins.add(frame.id);
	getDdpSdk().connection.ws?.close();
	return true;
};

export const installDdpSdkCollectionBridge = (): void => {
	const sdk = getDdpSdk();
	const { ddp } = sdk.client as unknown as { ddp: { onMessage: (cb: (payload: ParsedDdpFrame) => void) => () => void } };
	if (!ddp?.onMessage) return;

	ddp.onMessage((frame) => {
		if (withholdRetryableLoginFailure(frame)) return;
		if (!shouldBridgeToMeteor(frame)) return;

		// `_streamHandlers.onMessage` returns a Promise (the message handler is an
		// async generator). A throw inside the inner `_process_updated` /
		// `_process_result` (e.g. "No callback invoker for method N" when a
		// stale frame arrives after a force-logout cycle invalidates the
		// invoker) would otherwise escape this scope as an unhandled rejection,
		// aborting Meteor's frame queue and leaving subsequent login result
		// frames unprocessed. Wrap the call so both sync throws and async
		// rejections are contained — Meteor keeps draining the queue even when
		// individual frames hit dead invokers.
		try {
			const result = Meteor.connection._streamHandlers.onMessage(stringifyDDP(frame as DDPMessage)) as unknown;
			if (result && typeof (result as Promise<unknown>).then === 'function') {
				(result as Promise<unknown>).catch((err) => {
					console.warn('[ddpSdk] bridge frame drop (async)', frame.msg, err);
				});
			}
		} catch (err) {
			console.warn('[ddpSdk] bridge frame drop', frame.msg, err);
		}
	});
};

if (isSdkTransportEnabled()) {
	installDdpSdkCollectionBridge();
}
