import type { IServiceMetrics } from '@rocket.chat/core-services';
import { MeteorService, MeteorError } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { v1 as uuidv1 } from 'uuid';
import WebSocket from 'ws';

import type { Client } from './Client';
import { Publication } from './Publication';
import { encodeNosub, encodeResult, encodeUpdated } from './codec';
import type { IPacket } from './types/IPacket';

const logger = new Logger('DDP-Streamer');

type SubscriptionFn = (this: Publication, eventName: string, options: object) => void;
type MethodFn = (this: Client, ...args: any[]) => any;
type Methods = {
	[k: string]: MethodFn;
};

const handleInternalException = (err: unknown, msg: string): MeteorError => {
	if (err instanceof MeteorError) {
		return err;
	}

	// default errors are logged to the console and redacted from the client
	// TODO switch to using the logger (ideally broker.logger)
	logger.error({ msg, err });

	return new MeteorError(500, 'Internal server error');
};

export class Server {
	private _subscriptions = new Map<string, SubscriptionFn>();

	private _methods = new Map<string, MethodFn>();

	private metrics?: IServiceMetrics;

	public readonly id = uuidv1();

	setMetrics(metrics: IServiceMetrics): void {
		this.metrics = metrics;
	}

	async call(client: Client, packet: IPacket): Promise<void> {
		// if client is not connected we don't need to do anything
		if (client.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		try {
			// if method was not defined on DDP Streamer we fall back to Meteor
			if (!this._methods.has(packet.method)) {
				const result = await MeteorService.callMethodWithToken(client.userId, client.userToken, packet.method, packet.params);
				return this.sendResult(client, packet, result.result);
			}

			const fn = this._methods.get(packet.method);
			if (!fn) {
				throw new MeteorError(404, `Method '${packet.method}' not found`);
			}

			const result = await fn.apply(client, packet.params);
			return this.sendResult(client, packet, result);
		} catch (err: unknown) {
			return this.sendResult(client, packet, null, handleInternalException(err, 'Method call error'));
		}
	}

	methods(obj: Methods): void {
		Object.entries(obj).forEach(([name, fn]) => {
			if (this._methods.has(name)) {
				return;
			}
			this._methods.set(name, fn);
		});
	}

	async subscribe(client: Client, packet: IPacket): Promise<void> {
		// if client is not connected we don't need to do anything
		if (client.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		try {
			if (!this._subscriptions.has(packet.name)) {
				throw new MeteorError(404, `Subscription '${packet.name}' not found`);
			}
			const fn = this._subscriptions.get(packet.name);
			if (!fn) {
				throw new MeteorError(404, `Subscription '${packet.name}' not found`);
			}

			const end = this.metrics?.timer('rocketchat_subscription', { subscription: packet.name });

			const publication = new Publication(client, packet);
			const [eventName, options] = packet.params;
			await fn.call(publication, eventName, options);

			end?.();
		} catch (err: unknown) {
			return client.send(encodeNosub(packet.id, handleInternalException(err, 'Subscription error')));
		}
	}

	publish(name: string, fn: SubscriptionFn): void {
		if (this._subscriptions.has(name)) {
			return;
		}
		this._subscriptions.set(name, fn);
	}

	private sendResult(client: Client, { id }: IPacket, result?: any, error?: Error | MeteorError): void {
		client.send(encodeResult(id, result, error));
		return client.send(encodeUpdated(id));
	}
}
