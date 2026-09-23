import type { CallingOptions, IBroker, IBrokerNode, IServiceMetrics, IServiceClass, EventSignatures } from '@rocket.chat/core-services';
import { LocalServiceRegistry, MeteorError, asyncLocalStorage, getCallableMethods, isMeteorError } from '@rocket.chat/core-services';
import EJSON from 'ejson';
import type { ConnectionOptions, Msg, NatsConnection, Service, ServiceHandler, ServiceIdentity, ServiceMsg, Subscription } from 'nats';
import { Empty, ErrorCode, NatsError, RequestStrategy, ServiceError, connect } from 'nats';

import type { ServiceNodes } from './licenseEnforcement';
import { startLicenseEnforcement } from './licenseEnforcement';
import { consumeStreams, serveStreams } from './streams';

export { connect } from 'nats';

const { REQUEST_TIMEOUT = '60' } = process.env;

const requestTimeout = (parseInt(REQUEST_TIMEOUT) || 60) * 1000;

const TE = new TextEncoder();
const TD = new TextDecoder();

const SERVICE_VERSION = '0.1.0';

/**
 * Events and service methods must not share a subject space: several event names
 * are identical to a `<service>.<method>` pair (`accounts.login`), so without
 * distinct prefixes a broadcast would invoke the method and a call would be
 * delivered to the event listeners.
 */
const RPC_PREFIX = 'rpc';
const EVENT_PREFIX = 'event';

/** `node.<nodeID>.<service>.<method>`, used to honour `CallingOptions.nodeID`. */
const NODE_PREFIX = 'node';

const NODE_ID_METADATA = 'rocketchat-node-id';

const DISCOVERY_TIMEOUT = 1000;

/**
 * Unlike moleculer, nats has no registry to wait on: a request to a subject
 * nobody is listening on fails immediately with `503`. That happens whenever a
 * peer is booting or being rolled, so back off and try again for a short while.
 *
 * Only `503` is retried. It means the request reached no responder at all, so
 * nothing ran and a second attempt cannot duplicate a side effect. Any other
 * failure - a timeout above all - may well have been delivered.
 */
const NO_RESPONDERS_RETRY_DELAYS = [100, 250, 500, 1000, 2000];

/** `NatsError.code` is a plain string, so the enum member has to be widened to compare against it. */
const NO_RESPONDERS_CODE: string = ErrorCode.NoResponders;

/** Discovery is a request-many round trip; a short TTL keeps back to back lookups to a single ping. */
const DISCOVERY_TTL = 1000;

/** Every service but `settings` itself depends on these, as it does under moleculer. */
const DEFAULT_DEPENDENCIES = ['settings', 'license'];

/** How often a service still waiting on a remote dependency looks for it again - moleculer's `dependencyInterval`. */
const DEPENDENCY_INTERVAL = 1000;

const delay = async (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

function isNoResponders(e: unknown): boolean {
	return e instanceof NatsError && e.code === NO_RESPONDERS_CODE;
}

const internalMethods = new Set(['$node.list', '$node.services']);

type RegisteredService = {
	service: Service;
	subscriptions: Subscription[];
	stopLicenseEnforcement?: () => void;
};

/**
 * A NATS subject token cannot contain `.`, `*`, `>` or whitespace, so the node id
 * is reduced to a single safe token and that reduced form is used as the node
 * identity everywhere - including what `nodeList()` reports - so that a node id
 * handed back to `call()` always addresses the same subject.
 */
function toSubjectToken(nodeID: string): string {
	return nodeID.replace(/[^A-Za-z0-9_-]/g, '_');
}

function withDefaultDependencies(name: string, serviceDependencies: string[]): string[] {
	return [...serviceDependencies, ...(name === 'settings' ? [] : DEFAULT_DEPENDENCIES)].filter((dependency) => dependency !== name);
}

function encodePayload(value: unknown): Uint8Array {
	return value === undefined ? Empty : TE.encode(EJSON.stringify(value));
}

function decodePayload(data: Uint8Array): any {
	const decoded = TD.decode(data);

	return decoded ? EJSON.parse(decoded) : undefined;
}

function decodeParams(data: Uint8Array): any[] {
	return decodePayload(data) ?? [];
}

function encodeError(e: unknown): Uint8Array {
	if (isMeteorError(e)) {
		return TE.encode(EJSON.stringify(e.toJSON()));
	}

	const { message, stack } = e instanceof Error ? e : new Error(String(e));

	return TE.encode(EJSON.stringify({ message, stack }));
}

/** Header values are line based, so newlines in a message would corrupt the protocol frame. */
function toErrorDescription(e: unknown): string {
	const message = e instanceof Error ? e.message : String(e);

	return message.replace(/\s+/g, ' ').trim().slice(0, 200) || 'service error';
}

function restoreError(msg: Msg, serviceError: ServiceError): Error {
	const plain = decodePayload(msg.data);

	if (!plain) {
		return serviceError;
	}

	if (plain.errorType === 'Meteor.Error') {
		const error = new MeteorError(plain.error, plain.reason, plain.details);
		if (typeof plain.isClientSafe !== 'undefined') {
			error.isClientSafe = plain.isClientSafe;
		}
		return error;
	}

	const error = new Error(plain.message ?? serviceError.message);
	if (plain.stack) {
		error.stack = plain.stack;
	}

	return error;
}

export class NatsBroker implements IBroker {
	metrics?: IServiceMetrics | undefined;

	readonly nodeID: string;

	private nc?: NatsConnection;

	private started = false;

	private pendingServices: IServiceClass[] = [];

	private services = new Map<IServiceClass, RegisteredService>();

	private dependencies = new Map<IServiceClass, string[]>();

	private registrationWaiters = new Set<() => void>();

	private registrations = 0;

	private discovery?: { at: number; identities: Promise<ServiceIdentity[]> };

	private readonly localRegistry?: LocalServiceRegistry;

	/**
	 * @param dependencyTimeout milliseconds a service may wait for its dependencies
	 * before `start()` gives up - moleculer's `dependencyTimeout`, and like it `0`
	 * waits forever
	 */
	constructor(
		private options: ConnectionOptions,
		nodeID: string,
		private readonly dependencyTimeout = 0,
	) {
		this.nodeID = toSubjectToken(nodeID);

		// kill switch: leaving it out routes every call over nats, as if nothing were local
		this.localRegistry = process.env.BROKER_LOCAL_ROUTING === 'false' ? undefined : new LocalServiceRegistry();
	}

	async destroyService(instance: IServiceClass): Promise<void> {
		const registered = this.services.get(instance);
		this.services.delete(instance);
		this.dependencies.delete(instance);
		this.localRegistry?.remove(instance);

		if (registered) {
			registered.stopLicenseEnforcement?.();

			if (this.nc && !this.nc.isClosed()) {
				await Promise.all(registered.subscriptions.map((subscription) => subscription.drain()));
				await registered.service.stop();
			}
		}

		await instance.stopped();
		instance.removeAllListeners();
	}

	async createService(instance: IServiceClass, serviceDependencies: string[] = []): Promise<void> {
		this.dependencies.set(instance, withDefaultDependencies(instance.getName(), serviceDependencies));

		if (!this.started) {
			this.pendingServices.push(instance);
			return;
		}

		await this.startWhenReady([instance]);
	}

	/**
	 * Moleculer's `waitForServices`: a service is registered - and so reachable,
	 * locally and remotely - only once everything it depends on is, and for as long
	 * as that takes. That is what lets `started()` read from its dependencies.
	 *
	 * Services whose dependencies are met together are registered together before
	 * any of their hooks run, so a `started()` can call into a sibling that happened
	 * to come later in the list.
	 */
	private async startWhenReady(instances: IServiceClass[]): Promise<void> {
		let waiting = instances;
		const reported = new Set<IServiceClass>();
		const deadline = this.dependencyTimeout > 0 ? Date.now() + this.dependencyTimeout : Infinity;

		while (waiting.length) {
			// a service destroyed while it waited is dropped rather than registered
			waiting = waiting.filter((instance) => this.dependencies.has(instance));
			if (!waiting.length) {
				return;
			}

			const seen = this.registrations;
			const available = await this.availableServices(waiting);
			const missingOf = (instance: IServiceClass): string[] =>
				(this.dependencies.get(instance) ?? []).filter((dependency) => !available.has(dependency));

			const ready = waiting.filter((instance) => !missingOf(instance).length);
			waiting = waiting.filter((instance) => !ready.includes(instance));

			if (!ready.length) {
				for (const instance of waiting.filter((instance) => !reported.has(instance))) {
					reported.add(instance);
					console.log(`Service ${instance.getName()} waiting for ${missingOf(instance).join(', ')}`);
				}

				const remaining = deadline - Date.now();
				if (remaining <= 0) {
					const missing = waiting.map((instance) => `${instance.getName()} (${missingOf(instance).join(', ')})`);
					throw new Error(`Services timed out waiting for their dependencies: ${missing.join('; ')}`);
				}

				await this.nextRegistration(seen, Math.min(DEPENDENCY_INTERVAL, remaining));
				continue;
			}

			for (const instance of ready) {
				await this.registerService(instance);
			}

			for (const instance of ready) {
				await this.runLifecycleHook(instance, 'created');
			}

			for (const instance of ready) {
				await this.runLifecycleHook(instance, 'started');
			}
		}
	}

	/** Only asks the cluster when a dependency is not already running in this process. */
	private async availableServices(waiting: IServiceClass[]): Promise<Set<string>> {
		const available = new Set([...this.services.keys()].map((instance) => instance.getName()));

		const needsDiscovery = waiting.some((instance) => this.dependencies.get(instance)?.some((dependency) => !available.has(dependency)));
		if (!needsDiscovery) {
			return available;
		}

		try {
			for (const { name } of await this.discover()) {
				available.add(name);
			}
		} catch (err) {
			console.error('NatsBroker could not discover services', err);
		}

		return available;
	}

	/**
	 * Resolves on the next local registration, which may satisfy a dependency, or
	 * after `timeout` to look for remote ones. A registration since `seen` counts:
	 * it happened while the caller was still checking, and would otherwise be missed.
	 */
	private async nextRegistration(seen: number, timeout: number): Promise<void> {
		if (this.registrations !== seen) {
			return;
		}

		return new Promise((resolve) => {
			const wake = (): void => {
				clearTimeout(timer);
				this.registrationWaiters.delete(wake);
				resolve();
			};
			const timer = setTimeout(wake, timeout);
			this.registrationWaiters.add(wake);
		});
	}

	/**
	 * Everything a service runs through this broker sees the same context, on the
	 * local and the remote path alike. `ServiceClass.context` is not decoration:
	 * ddp-streamer's `created()` returns early without it, which silently disables
	 * the handler that sends a client its own user document after login.
	 */
	private runInContext<T>(fn: () => Promise<T>): Promise<T> {
		return asyncLocalStorage.run({ id: '', nodeID: this.nodeID, requestID: null, broker: this }, fn);
	}

	/**
	 * Endpoints are registered before any hook runs, so a service whose `created`
	 * or `started` throws still answers - with whatever defaults it holds. Letting
	 * the rejection escape would instead reject `api.start()` and take down the
	 * whole process, along with every other service hosted in it.
	 */
	private async runLifecycleHook(instance: IServiceClass, hook: 'created' | 'started'): Promise<void> {
		try {
			await this.runInContext(() => instance[hook]());
		} catch (err) {
			console.error(`Service ${instance.getName()} failed to run ${hook}()`, err);
		}
	}

	private async registerService(instance: IServiceClass): Promise<void> {
		const { nc } = this;
		if (!nc) {
			throw new Error('NatsBroker not connected');
		}

		const name = instance.getName();
		if (!name) {
			return;
		}

		const serviceInstance = instance as any;

		const service = await nc.services.add({
			name,
			version: SERVICE_VERSION,
			metadata: { [NODE_ID_METADATA]: this.nodeID },
		});

		// one subscription per event routed through `emit`, so listeners registered
		// after this point are still reached
		const subscriptions = instance.getEvents().map(({ eventName }) =>
			nc.subscribe(`${EVENT_PREFIX}.${String(eventName)}`, {
				callback: (_error, msg): void => {
					instance.emit(eventName, ...(decodeParams(msg.data) as Parameters<EventSignatures[typeof eventName]>));
				},
			}),
		);

		const shared = service.addGroup(`${RPC_PREFIX}.${name}`);
		const scoped = service.addGroup(`${NODE_PREFIX}.${this.nodeID}.${name}`);

		for (const method of getCallableMethods(instance)) {
			const respond = async (msg: ServiceMsg): Promise<void> => {
				try {
					const args = consumeStreams(nc, decodeParams(msg.data), requestTimeout) as unknown[];
					const result = await this.runInContext(() => serviceInstance[method](...args));

					msg.respond(encodePayload(serveStreams(nc, result, requestTimeout)));
				} catch (e) {
					// nats only turns *synchronous* throws into an error reply, so an async
					// handler has to answer explicitly or the caller waits for the timeout
					msg.respondError(500, toErrorDescription(e), encodeError(e));
				}
			};

			const handler: ServiceHandler = (_error, msg): void => void respond(msg);

			shared.addEndpoint(method, handler);
			// same handler on a subject unique to this process, so a call can target one
			// instance instead of being load balanced across the queue group
			scoped.addEndpoint(method, handler);
		}

		this.localRegistry?.add(instance);

		this.services.set(instance, {
			service,
			subscriptions,
			...(!instance.isInternal() && { stopLicenseEnforcement: this.startLicenseEnforcement(name) }),
		});

		// a discovery cached before this registration would leave it out
		this.discovery = undefined;
		this.registrations++;
		this.registrationWaiters.forEach((wake) => wake());
	}

	private startLicenseEnforcement(serviceName: string): () => void {
		return startLicenseEnforcement({
			serviceName,
			nodeID: this.nodeID,
			hasValidLicense: () => this.call('license.hasValidLicense', ['scalability']),
			listServices: () => this.serviceList(),
			fatal: (message: string): void => {
				console.error(message);
				process.exit(1);
			},
		});
	}

	async call(method: string, data: any, options?: CallingOptions): Promise<any> {
		if (!this.started || !this.nc) {
			return;
		}

		if (internalMethods.has(method)) {
			return this.callInternal(method);
		}

		// a service in this process answers directly, so arguments and the result keep
		// their identity instead of being flattened by EJSON
		if (!options?.nodeID || toSubjectToken(options.nodeID) === this.nodeID) {
			const local = this.localRegistry?.resolve(method);
			if (local) {
				return this.runInContext(() => local(data ?? []));
			}
		}

		const subject = options?.nodeID ? `${NODE_PREFIX}.${toSubjectToken(options.nodeID)}.${method}` : `${RPC_PREFIX}.${method}`;

		const msg = await this.request(this.nc, subject, encodePayload(serveStreams(this.nc, data, requestTimeout)));

		const serviceError = ServiceError.toServiceError(msg);
		if (serviceError) {
			throw restoreError(msg, serviceError);
		}

		return consumeStreams(this.nc, decodePayload(msg.data), requestTimeout);
	}

	private async request(nc: NatsConnection, subject: string, payload: Uint8Array): Promise<Msg> {
		for (const backoff of NO_RESPONDERS_RETRY_DELAYS) {
			try {
				return await nc.request(subject, payload, { timeout: requestTimeout });
			} catch (e) {
				if (!isNoResponders(e)) {
					throw e;
				}

				await delay(backoff);
			}
		}

		// last attempt, so a still missing responder surfaces to the caller
		return nc.request(subject, payload, { timeout: requestTimeout });
	}

	/** Moleculer internals that application code still calls through the broker. */
	private async callInternal(method: string): Promise<any> {
		switch (method) {
			case '$node.list':
				return this.nodeList();
			case '$node.services':
				return this.serviceList();
			default:
				throw new Error(`unknown internal method: ${method}`);
		}
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		_services: string[],
		_event: T,
		..._args: Parameters<EventSignatures[T]>
	): Promise<void> {
		// TODO implement
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		if (!this.started || !this.nc) {
			return;
		}

		this.nc.publish(`${EVENT_PREFIX}.${String(event)}`, encodePayload(args));
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		for (const instance of this.services.keys()) {
			instance.emit(event, ...args);
		}
	}

	async nodeList(): Promise<IBrokerNode[]> {
		const nodes = new Map<string, IBrokerNode>();

		for (const { metadata } of await this.discover()) {
			const nodeID = metadata?.[NODE_ID_METADATA];
			if (!nodeID) {
				continue;
			}

			nodes.set(nodeID, { id: nodeID, available: true, local: nodeID === this.nodeID });
		}

		return [...nodes.values()];
	}

	private async serviceList(): Promise<ServiceNodes[]> {
		const nodesByService = new Map<string, Set<string>>();

		for (const { name, metadata } of await this.discover()) {
			const nodeID = metadata?.[NODE_ID_METADATA];
			if (!nodeID) {
				continue;
			}

			const nodes = nodesByService.get(name) ?? new Set<string>();
			nodes.add(nodeID);
			nodesByService.set(name, nodes);
		}

		return [...nodesByService].map(([name, nodes]) => ({ name, nodes: [...nodes] }));
	}

	private async discover(): Promise<ServiceIdentity[]> {
		const { nc } = this;
		if (!nc || nc.isClosed()) {
			throw new Error('NatsBroker not connected');
		}

		const now = Date.now();
		if (this.discovery && now - this.discovery.at < DISCOVERY_TTL) {
			return this.discovery.identities;
		}

		const identities = (async (): Promise<ServiceIdentity[]> => {
			const client = nc.services.client({ strategy: RequestStrategy.JitterTimer, maxWait: DISCOVERY_TIMEOUT });

			const found: ServiceIdentity[] = [];
			for await (const identity of await client.ping()) {
				found.push(identity);
			}

			return found;
		})();

		const discovery = { at: now, identities };
		this.discovery = discovery;

		// a failed discovery must not be served from the cache
		identities.catch(() => {
			if (this.discovery === discovery) {
				this.discovery = undefined;
			}
		});

		return identities;
	}

	async start(): Promise<void> {
		this.nc = await connect(this.options);
		this.started = true;

		const pending = this.pendingServices;
		this.pendingServices = [];

		await this.startWhenReady(pending);

		console.log('NatsBroker started successfully.');
	}
}
