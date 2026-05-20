import type { DDPSDK } from '@rocket.chat/ddp-client';
import EJSON from 'ejson';

type StreamerDDPConnection = {
	_stream: {
		on: {
			(key: 'message', callback: (data: string) => void): void;
			(key: 'reset', callback: () => void): void;
		};
	};
	subscribe(name: string, ...args: unknown[]): { stop: () => void };
	call(methodName: string, ...args: unknown[]): void;
	hasMeteorStreamerEventListeners?: boolean;
};

/**
 * Presents a DDPSDK instance with the shape `StreamerCentral` expects
 * (the subset of Meteor.connection exposed as `StreamerDDPConnection`).
 * Lets us run the existing streamer infrastructure against our SDK's
 * WebSocket without rewriting StreamerCentral.
 */
export const createDdpSdkStreamerAdapter = (sdk: DDPSDK): StreamerDDPConnection => {
	const { ddp } = sdk.client as unknown as { ddp: { onMessage: (cb: (payload: unknown) => void) => () => void } };

	return {
		_stream: {
			on: ((key: 'message' | 'reset', callback: ((data: string) => void) | (() => void)): void => {
				if (key === 'message') {
					ddp.onMessage((payload) => {
						// StreamerCentral re-parses the string with JSON.parse; hand it
						// an EJSON-serialised payload so Dates/undefined round-trip the
						// same way Meteor.connection's raw WS frames did.
						(callback as (data: string) => void)(EJSON.stringify(payload));
					});
					return;
				}
				if (key === 'reset') {
					sdk.connection.on('disconnected', callback as () => void);
				}
			}) as StreamerDDPConnection['_stream']['on'],
		},
		subscribe: (name: string, ...args: unknown[]) => sdk.client.subscribe(name, ...args),
		call: (methodName: string, ...args: unknown[]): void => {
			void sdk.client.callAsync(methodName, ...args);
		},
	};
};
