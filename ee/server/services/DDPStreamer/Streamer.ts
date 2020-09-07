import { EventEmitter } from 'events';

import { server } from './configureServer';
import { DDP_EVENTS, STREAM_NAMES } from './constants';
import { sendBroadcast } from './lib/sendBroadcast';
import { isEmpty } from './lib/utils';
import { Publication } from './Publication';
import { Client } from './Client';
import { api } from '../../../../server/sdk/api';

type Rule = (this: Publication, eventName: string, ...args: any) => Promise<boolean>;

interface IRules {
	[k: string]: Rule;
}

export type ISubscription = {
	client: Client;
}

export const send = function(self: Publication, msg: string): void {
	if (!self.client) {
		return;
	}
	self.client.send(msg);
};

export const changedPayload = (collection: string, fields: object): string | false => !isEmpty(fields) && server.serialize({
	[DDP_EVENTS.MSG]: DDP_EVENTS.CHANGED,
	[DDP_EVENTS.COLLECTION]: collection,
	[DDP_EVENTS.ID]: 'id',
	[DDP_EVENTS.FIELDS]: fields,
});

// PRIVATE METHODS

const allow = Symbol('allow');
const isAllowed = Symbol('isAllowed');
export const publish = Symbol('publish');

export const Streams = new Map();

export class Stream extends EventEmitter {
	subscriptionName: string;

	// retransmit = true;

	// retransmitToSelf = false;

	private subscriptionsByEventName = new Map<string, Set<ISubscription>>();

	private _allowRead = {};

	private _allowWrite = {};

	constructor(
		private name: string,
		// { retransmit = true, retransmitToSelf = false }: {retransmit?: boolean; retransmitToSelf?: boolean } = {},
	) {
		super();

		this.subscriptionName = `${ STREAM_NAMES.STREAMER_PREFIX }${ name }`;
		// this.retransmit = retransmit;
		// this.retransmitToSelf = retransmitToSelf;

		// this.subscriptionsByEventName = new Map();

		this.iniPublication();

		this.allowRead('none');
		this.allowWrite('none');

		Streams.set(name, this);
	}

	[allow](rules: IRules, name: string) {
		return (eventName: string | boolean | Rule, fn?: Rule): boolean | undefined => {
			const _eventName: string = typeof eventName === 'string' ? eventName : '__all__';

			if (typeof eventName === 'function') {
				fn = eventName;
			}

			if (fn) {
				rules[_eventName] = fn;
				return;
			}

			if (!['all', 'none', 'logged'].includes(_eventName)) {
				console.error(`${ name } shortcut '${ fn }' is invalid`);
			}

			if (eventName === 'all' || eventName === true) {
				rules[_eventName] = async function(): Promise<boolean> {
					return true;
				};
				return;
			}

			if (eventName === 'none' || eventName === false) {
				rules[_eventName] = async function(): Promise<boolean> {
					return false;
				};
				return;
			}

			if (eventName === 'logged') {
				rules[_eventName] = async function(): Promise<boolean> {
					return Boolean(this.uid);
				};
			}
		};
	}

	allowRead(eventName: string | boolean | Rule, fn?: Rule): boolean | undefined {
		return this[allow](this._allowRead, 'allowRead')(eventName, fn);
	}

	allowWrite(eventName: string | boolean | Rule, fn?: Rule): boolean | undefined {
		return this[allow](this._allowWrite, 'allowWrite')(eventName, fn);
	}

	[isAllowed](rules: IRules, defaultPermission = false) {
		return async (scope: Publication, eventName: string, args: any): Promise<boolean> => {
			if (rules[eventName]) {
				return rules[eventName].call(scope, eventName, ...args);
			}

			if (rules.__all__) {
				return rules.__all__.call(scope, eventName, ...args);
			}

			// TODO: Check this since we have permissions not defined here yet
			return defaultPermission;
		};
	}

	async isReadAllowed(scope: Publication, eventName: string, args: any): Promise<boolean> {
		// TODO: Check this since we have permissions not defined here yet
		return this[isAllowed](this._allowRead, true)(scope, eventName, args);
	}

	async isWriteAllowed(scope: Publication, eventName: string, args: any): Promise<boolean> {
		return this[isAllowed](this._allowWrite)(scope, eventName, args);
	}

	addSubscription(subscription: ISubscription, eventName: string): void {
		// this.subscriptions.add(subscription);
		if (!this.subscriptionsByEventName.has(eventName)) {
			this.subscriptionsByEventName.set(
				eventName,
				new Set([subscription]),
			);
			return;
		}

		this.subscriptionsByEventName.get(eventName)?.add(subscription);
	}

	removeSubscription(subscription: ISubscription, eventName: string): void {
		// this.subscriptions.delete(subscription);
		const subscriptions = this.subscriptionsByEventName.get(eventName);
		if (subscriptions) {
			subscriptions.delete(subscription);
			if (!subscriptions.size) {
				this.subscriptionsByEventName.delete(eventName);
			}
		}
	}

	async [publish](publication: Publication, eventName = '', options: boolean | {useCollection?: boolean; args?: any} = false): Promise<void> {
		let args = [];

		if (typeof options === 'boolean') {
			// useCollection = options;
		} else {
			if (options.useCollection) {
				// useCollection = options.useCollection;
			}

			if (options.args) {
				args = options.args;
			}
		}
		if (!eventName || eventName.length === 0) {
			throw new Error('invalid-event-name');
		}

		const isAllowed = await this.isReadAllowed(publication, eventName, args);
		if (isAllowed !== true) {
			throw new Error('not-allowed');
		}

		this.addSubscription(publication, eventName);
		publication.once('stop', () =>
			this.removeSubscription(publication, eventName),
		);
		publication.ready();
	}

	async iniPublication(): Promise<void> {
		const p = this[publish].bind(this);
		const initMethod = this.initMethod.bind(this);
		server.subscribe(this.subscriptionName, function(publication, _client, eventName, options) {
			initMethod(publication);
			return p(publication, eventName, options);
		});
	}

	async initMethod(publication: Publication): Promise<void> {
		const { isWriteAllowed, name, subscriptionName } = this;

		const method = {
			async [this.subscriptionName](this: Client, eventName: string, ...args: any[]): Promise<void> {
				const isAllowed = await isWriteAllowed(publication, eventName, args);
				if (isAllowed !== true) {
					return;
				}

				const payload = changedPayload(subscriptionName, { eventName, args });

				if (!payload) {
					return;
				}

				api.broadcast('stream', [
					name,
					eventName,
					payload,
				]);
			},
		};

		server.methods(method);
	}

	async emitPayload(eventName: string, payload: string): Promise<void> {
		if (!payload) {
			return;
		}
		const subscriptions = this.subscriptionsByEventName.get(eventName);
		if (!subscriptions || !subscriptions.size) {
			return;
		}
		return sendBroadcast(subscriptions, payload);
	}

	emit(eventName: string, ...args: any[]): boolean {
		const subscriptions = this.subscriptionsByEventName.get(eventName);
		if (!subscriptions || !subscriptions.size) {
			return false;
		}

		const msg = changedPayload(this.subscriptionName, {
			eventName,
			args,
		});

		if (!msg) {
			return false;
		}

		sendBroadcast(subscriptions, msg);
		return true;
	}

	__emit(event: string, ...args: any[]): boolean {
		return super.emit(event, ...args);
	}

	// emitWithoutBroadcast(event: string, ...args: any[]): boolean {
	// 	return this._emit(event, args, undefined, false);
	// }
}
