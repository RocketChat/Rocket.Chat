import EJSON from 'ejson';
import type { Msg, MsgHdrs, PublishOptions, ServiceHandler, ServiceIdentity, ServiceMsg } from 'nats';
import { Empty, ServiceErrorCodeHeader, ServiceErrorHeader, headers } from 'nats';

/**
 * In memory stand in for a NatsConnection, covering only what NatsBroker uses:
 * subject routing, request/reply, the micro service registry and discovery.
 *
 * Test only, but it lives outside the spec file so more than one suite can use it.
 */
export class FakeNatsConnection {
	readonly endpoints = new Map<string, ServiceHandler>();

	readonly subscriptions = new Map<string, Set<(msg: Msg) => void>>();

	/** Every subject a request was sent to, in order. */
	readonly requested: string[] = [];

	readonly stoppedServices: string[] = [];

	drainedSubscriptions = 0;

	private identities: ServiceIdentity[] = [];

	private closed = false;

	isClosed(): boolean {
		return this.closed;
	}

	close(): void {
		this.closed = true;
	}

	subscribe(subject: string, { callback }: { callback: (error: null, msg: Msg) => void }): { drain: () => Promise<void> } {
		const listener = (msg: Msg): void => callback(null, msg);

		const listeners = this.subscriptions.get(subject) ?? new Set();
		listeners.add(listener);
		this.subscriptions.set(subject, listeners);

		return {
			drain: async (): Promise<void> => {
				listeners.delete(listener);
				this.drainedSubscriptions++;
			},
		};
	}

	publish(subject: string, data: Uint8Array): void {
		this.subscriptions.get(subject)?.forEach((listener) => listener(this.toMsg(subject, data)));
	}

	async request(subject: string, data: Uint8Array): Promise<Msg> {
		this.requested.push(subject);

		const handler = this.endpoints.get(subject);
		if (!handler) {
			throw new Error(`503: no responders for '${subject}'`);
		}

		return new Promise<Msg>((resolve) => {
			handler(null, this.toServiceMsg(subject, data, resolve));
		});
	}

	readonly services = {
		add: async ({ name, metadata }: { name: string; version: string; metadata?: Record<string, string> }) => {
			const owned: string[] = [];

			this.identities.push({ name, id: `${name}-id`, version: '0.1.0', metadata } as ServiceIdentity);

			const addGroup = (group: string) => ({
				addEndpoint: (endpoint: string, handler: ServiceHandler): void => {
					const subject = `${group}.${endpoint}`;
					owned.push(subject);
					this.endpoints.set(subject, handler);
				},
			});

			return {
				addGroup,
				stop: async (): Promise<null> => {
					this.stoppedServices.push(name);
					owned.forEach((subject) => this.endpoints.delete(subject));
					return null;
				},
			};
		},

		client: () => ({
			ping: async (): Promise<AsyncIterable<ServiceIdentity>> => {
				const { identities } = this;

				return {
					async *[Symbol.asyncIterator]() {
						yield* identities;
					},
				};
			},
		}),
	};

	/** Adds a responder that belongs to another node, so discovery sees more than one. */
	addRemoteIdentity(name: string, nodeID: string): void {
		this.identities.push({
			name,
			id: `${name}-${nodeID}`,
			version: '0.1.0',
			metadata: { 'rocketchat-node-id': nodeID },
		} as unknown as ServiceIdentity);
	}

	private toMsg(subject: string, data: Uint8Array, hdrs?: MsgHdrs): Msg {
		return {
			subject,
			data,
			headers: hdrs,
			sid: 0,
			reply: '',
			respond: () => true,
			json: () => EJSON.parse(new TextDecoder().decode(data)),
			string: () => new TextDecoder().decode(data),
		};
	}

	private toServiceMsg(subject: string, data: Uint8Array, resolve: (msg: Msg) => void): ServiceMsg {
		return {
			...this.toMsg(subject, data),
			respond: (payload: Uint8Array = Empty, opts?: PublishOptions): boolean => {
				resolve(this.toMsg(subject, payload, opts?.headers));
				return true;
			},
			respondError: (code: number, description: string, payload: Uint8Array = Empty): boolean => {
				const hdrs = headers();
				hdrs.set(ServiceErrorCodeHeader, `${code}`);
				hdrs.set(ServiceErrorHeader, description);

				resolve(this.toMsg(subject, payload, hdrs));
				return true;
			},
		};
	}
}
