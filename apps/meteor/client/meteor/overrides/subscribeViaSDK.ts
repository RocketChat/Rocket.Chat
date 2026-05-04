import { Meteor } from 'meteor/meteor';

import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../../lib/sdk/sdkTransportEnabled';

/**
 * Route Meteor.connection.subscribe through DDPSDK so the few direct
 * publications that Accounts and Meteor core still open
 * (loginServiceConfiguration, meteor_autoupdate_clientVersions, ...)
 * ride our single WebSocket instead of Meteor's.
 *
 * The collection frames produced by those subscriptions are re-fed into
 * Meteor.connection._streamHandlers by ddpSdkCollectionBridge, so
 * Meteor's collection dispatch keeps working unchanged.
 */

type SubscribeCallbacks = {
	onReady?: () => void;
	onError?: (err: Error) => void;
	onStop?: (err?: Error) => void;
};

const extractCallbacks = (args: unknown[]): { params: unknown[]; callbacks: SubscribeCallbacks } => {
	if (args.length === 0) return { params: [], callbacks: {} };

	const last = args[args.length - 1];

	if (typeof last === 'function') {
		return { params: args.slice(0, -1), callbacks: { onReady: last as () => void } };
	}

	if (
		last !== null &&
		typeof last === 'object' &&
		(typeof (last as any).onReady === 'function' ||
			typeof (last as any).onError === 'function' ||
			typeof (last as any).onStop === 'function')
	) {
		return { params: args.slice(0, -1), callbacks: last as SubscribeCallbacks };
	}

	return { params: args, callbacks: {} };
};

type MeteorSubscriptionHandle = Meteor.SubscriptionHandle;

if (isSdkTransportEnabled()) {
	(Meteor.connection as any).subscribe = ((name: string, ...rest: unknown[]): MeteorSubscriptionHandle => {
		const { params, callbacks } = extractCallbacks(rest);
		const subscription = getDdpSdk().client.subscribe(name, ...params);

		subscription
			.ready()
			.then(() => callbacks.onReady?.())
			.catch((err: Error) => callbacks.onError?.(err));

		return {
			stop: () => {
				subscription.stop();
				callbacks.onStop?.();
			},
			ready: () => subscription.isReady,
		} as MeteorSubscriptionHandle;
	}) as Meteor.IMeteorConnection['subscribe'];
}
