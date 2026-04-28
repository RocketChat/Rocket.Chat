import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';

import { getDdpSdk } from '../../lib/sdk/ddpSdk';

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

type ParsedDdpFrame = { msg?: string } & Record<string, unknown>;

const COLLECTION_FRAMES = new Set(['added', 'changed', 'removed', 'addedBefore', 'movedBefore']);
const SUBSCRIPTION_LIFECYCLE_FRAMES = new Set(['ready', 'nosub']);

const shouldBridgeToMeteor = (frame: ParsedDdpFrame): boolean => {
	if (!frame || typeof frame.msg !== 'string') return false;
	return COLLECTION_FRAMES.has(frame.msg) || SUBSCRIPTION_LIFECYCLE_FRAMES.has(frame.msg);
};

export const installDdpSdkCollectionBridge = (): void => {
	const sdk = getDdpSdk();
	const { ddp } = sdk.client as unknown as { ddp: { onMessage: (cb: (payload: ParsedDdpFrame) => void) => () => void } };
	if (!ddp?.onMessage) return;

	ddp.onMessage((frame) => {
		if (!shouldBridgeToMeteor(frame)) return;

		// Guard against frames that would collide with Meteor's own subscription
		// ids. DDPSDK generates its own ids (rc-ddp-client-<n>); Meteor.connection's
		// invokers ignore frames whose id is not in its tables, so a plain
		// re-feed is safe.
		try {
			Meteor.connection._streamHandlers.onMessage(DDPCommon.stringifyDDP(frame as Parameters<typeof DDPCommon.stringifyDDP>[0]));
		} catch (err) {
			// eslint-disable-next-line no-console
			console.warn('[ddpSdk] bridge frame drop', frame.msg, err);
		}
	});
};

installDdpSdkCollectionBridge();
