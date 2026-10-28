import type { IServiceMetrics } from '@rocket.chat/core-services';
import { ClientSafeError } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { v1 as uuidv1 } from 'uuid';
import WebSocket from 'ws';

import type { IPacket } from './IPacket';
import { Publication } from './Publication';
import type { Session } from './Session';
import { encodeNosub, encodeResult, encodeUpdated } from './codec';

const logger = new Logger('DDP-Streamer');

type SubscriptionFn = (this: Publication, eventName: string, options: object) => void;
type MethodFn = (this: Session, ...args: any[]) => any;
type Methods = {
	[k: string]: MethodFn;
};

/** Resolves a method call that no local method handles, with the caller's credentials. */
export type RemoteMethodCall = (session: Session, method: string, params: any[]) => Promise<unknown>;

const noRemoteMethods: RemoteMethodCall = async (_client, method) => {
	throw new ClientSafeError(404, `Method '${method}' not found`);
};

const handleInternalException = (err: unknown, msg: string): ClientSafeError => {
	if (err instanceof ClientSafeError) {
		return err;
	}

	// an unexpected error's details stay in the log; the client only gets a generic 500
	logger.error({ msg, err });

	return new ClientSafeError(500, 'Internal server error');
};

export class Server {
	private _subscriptions = new Map<string, SubscriptionFn>();

	private _methods = new Map<string, MethodFn>();

	private metrics?: IServiceMetrics;

	public readonly id = uuidv1();

	constructor(private readonly callRemoteMethod: RemoteMethodCall = noRemoteMethods) {}

	setMetrics(metrics: IServiceMetrics): void {
		this.metrics = metrics;
	}

	async call(session: Session, packet: IPacket): Promise<void> {
		if (session.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		try {
			if (!this._methods.has(packet.method)) {
				return this.sendResult(session, packet, await this.callRemoteMethod(session, packet.method, packet.params));
			}

			const fn = this._methods.get(packet.method);
			if (!fn) {
				throw new ClientSafeError(404, `Method '${packet.method}' not found`);
			}

			const result = await fn.apply(session, packet.params);
			return this.sendResult(session, packet, result);
		} catch (err: unknown) {
			return this.sendResult(session, packet, null, handleInternalException(err, 'Method call error'));
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

	async subscribe(session: Session, packet: IPacket): Promise<void> {
		if (session.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		let publication: Publication | undefined;
		try {
			if (!this._subscriptions.has(packet.name)) {
				throw new ClientSafeError(404, `Subscription '${packet.name}' not found`);
			}
			const fn = this._subscriptions.get(packet.name);
			if (!fn) {
				throw new ClientSafeError(404, `Subscription '${packet.name}' not found`);
			}

			const end = this.metrics?.timer('rocketchat_subscription', { subscription: packet.name });

			publication = new Publication(session, packet);
			const [eventName, options] = packet.params;
			await fn.call(publication, eventName, options);

			end?.();
		} catch (err: unknown) {
			session.send(encodeNosub(packet.id, handleInternalException(err, 'Subscription error')));
			// A failed subscription must not outlive its handler.
			publication?.emit('stop', session, packet);
		}
	}

	publish(name: string, fn: SubscriptionFn): void {
		if (this._subscriptions.has(name)) {
			return;
		}
		this._subscriptions.set(name, fn);
	}

	private sendResult(session: Session, { id }: IPacket, result?: any, error?: Error | ClientSafeError): void {
		session.send(encodeResult(id, result, error));
		return session.send(encodeUpdated(id));
	}
}
