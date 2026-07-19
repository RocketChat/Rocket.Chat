import { inspect as utilInspect } from 'node:util';

import * as jsonrpc from 'jsonrpc-lite';

import type { AppBridges } from '../../bridges';
import type { AppAccessorManager, AppApiManager } from '../../managers';

const inspect = (value: unknown) => utilInspect(value, { depth: 10, compact: true, breakLength: Infinity });

export const ALLOWED_ACCESSOR_METHODS = [
	'getConfigurationExtend',
	'getEnvironmentRead',
	'getEnvironmentWrite',
	'getConfigurationModify',
	'getReader',
	'getPersistence',
	'getHttp',
	'getModifier',
] as Array<
	keyof Pick<
		AppAccessorManager,
		| 'getConfigurationExtend'
		| 'getEnvironmentRead'
		| 'getEnvironmentWrite'
		| 'getConfigurationModify'
		| 'getReader'
		| 'getPersistence'
		| 'getHttp'
		| 'getModifier'
	>
>;

function isValidOrigin(accessor: string): accessor is (typeof ALLOWED_ACCESSOR_METHODS)[number] {
	return ALLOWED_ACCESSOR_METHODS.includes(accessor as any);
}

export type AppRequestRouterDeps = {
	appId: string;
	accessors: AppAccessorManager;
	api: AppApiManager;
	bridges: AppBridges;
	debug: debug.Debugger;
	// Reports the controller state so the router can hijack ConfigurationExtend
	// calls while an app is being restarted (resources must not be re-registered).
	getState: () => string;
};

/**
 * Transport-agnostic dispatcher for the requests an app runtime makes back to
 * the host: accessor calls (`accessor:*`) and bridge calls (`bridges:*`).
 *
 * This logic used to live inside {@link BaseRuntimeSubprocessController}, coupled
 * to the child_process transport. It is extracted here so every runtime - the
 * Node subprocess runtime and the Watt worker runtime - resolves and guards
 * these host-side calls through exactly the same, security-sensitive code path.
 */
export class AppRequestRouter {
	constructor(private readonly deps: AppRequestRouterDeps) {}

	private get debug() {
		return this.deps.debug;
	}

	public async handleAccessorMessage({
		payload: { method, id, params },
	}: jsonrpc.IParsedObjectRequest): Promise<jsonrpc.SuccessObject> {
		const accessorMethods = method.substring(9).split(':'); // First 9 characters are always 'accessor:'

		this.debug('Handling accessor message %s with params %s', inspect(accessorMethods), inspect(params));

		const managerOrigin = accessorMethods.shift();
		const tailMethodName = accessorMethods.pop();

		// If we're restarting the app, we can't register resources again, so we
		// hijack requests for the `ConfigurationExtend` accessor and don't let them through
		// This needs to be refactored ASAP
		if (this.deps.getState() === 'restarting' && managerOrigin === 'getConfigurationExtend') {
			return jsonrpc.success(id, null);
		}

		if (managerOrigin === 'api' && tailMethodName === 'listApis') {
			const result = this.deps.api.listApis(this.deps.appId);

			return jsonrpc.success(id, result);
		}

		/**
		 * At this point, the accessorMethods array will contain the path to the accessor from the origin (AppAccessorManager)
		 * The accessor is the one that contains the actual method the app wants to call
		 *
		 * Most of the times, it will take one step from origin to accessor
		 * For example, for the call AppAccessorManager.getEnvironmentRead().getServerSettings().getValueById() we'll have
		 * the following:
		 *
		 * ```
		 * const managerOrigin = 'getEnvironmentRead'
		 * const tailMethod = 'getValueById'
		 * const accessorMethods = ['getServerSettings']
		 * ```
		 *
		 * But sometimes there can be more steps, like in the following example:
		 * AppAccessorManager.getReader().getEnvironmentReader().getEnvironmentVariables().getValueByName()
		 * In this case, we'll have:
		 *
		 * ```
		 * const managerOrigin = 'getReader'
		 * const tailMethod = 'getValueByName'
		 * const accessorMethods = ['getEnvironmentReader', 'getEnvironmentVariables']
		 * ```
		 **/
		// Prevent app from trying to get properties from the manager that
		// are not intended for public access
		if (!isValidOrigin(managerOrigin)) {
			throw new Error(`Invalid accessor namespace "${managerOrigin}"`);
		}

		// Need to fix typing of return value
		const getAccessorForOrigin = (
			accessorMethods: string[],
			managerOrigin: (typeof ALLOWED_ACCESSOR_METHODS)[number],
			accessorManager: AppAccessorManager,
		) => {
			const origin = accessorManager[managerOrigin](this.deps.appId);

			if (managerOrigin === 'getHttp' || managerOrigin === 'getPersistence') {
				return origin;
			}

			if (managerOrigin === 'getConfigurationExtend' || managerOrigin === 'getConfigurationModify') {
				return origin[accessorMethods[0] as keyof typeof origin];
			}

			let accessor = origin;

			// Call all intermediary objects to "resolve" the accessor
			accessorMethods.forEach((methodName) => {
				const method = accessor[methodName as keyof typeof accessor] as unknown;

				if (typeof method !== 'function') {
					throw new Error(`Invalid accessor method "${methodName}"`);
				}

				accessor = method.apply(accessor);
			});

			return accessor;
		};

		const accessor = getAccessorForOrigin(accessorMethods, managerOrigin, this.deps.accessors);

		const tailMethod = accessor[tailMethodName as keyof typeof accessor] as unknown;

		if (typeof tailMethod !== 'function') {
			throw new Error(`Invalid accessor method "${tailMethodName}"`);
		}

		const result = await tailMethod.apply(accessor, params);

		return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
	}

	public async handleBridgeMessage({
		payload: { method, id, params },
	}: jsonrpc.IParsedObjectRequest): Promise<jsonrpc.SuccessObject | jsonrpc.ErrorObject> {
		const [bridgeName, bridgeMethod] = method.substring(8).split(':');

		this.debug('Handling bridge message %s().%s() with params %s', bridgeName, bridgeMethod, inspect(params));

		const bridge = this.deps.bridges[bridgeName as keyof AppBridges];

		if (!bridgeMethod.startsWith('do') || typeof bridge !== 'function' || !Array.isArray(params)) {
			throw new Error('Invalid bridge request');
		}

		const bridgeInstance = bridge.call(this.deps.bridges);

		const methodRef = bridgeInstance[bridgeMethod as keyof typeof bridge] as unknown;

		if (typeof methodRef !== 'function') {
			throw new Error('Invalid bridge request');
		}

		let result;
		try {
			result = await methodRef.apply(
				bridgeInstance,
				// The APP_ID placeholder is replaced with the real app id here so an app
				// cannot impersonate another one by sending a forged id from the runtime.
				params.map((value: unknown) => (value === 'APP_ID' ? this.deps.appId : value)),
			);
		} catch (error) {
			this.debug('Error executing bridge method %s().%s() %s', bridgeName, bridgeMethod, inspect(error.message));
			const jsonRpcError = new jsonrpc.JsonRpcError(error.message, -32000, error);
			return jsonrpc.error(id, jsonRpcError);
		}

		return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
	}

	/**
	 * Resolves an incoming `accessor:*` or `bridges:*` request into a JSON-RPC
	 * response, translating thrown errors into JSON-RPC error objects.
	 */
	public async route(
		message: jsonrpc.IParsedObjectRequest,
	): Promise<jsonrpc.SuccessObject | jsonrpc.ErrorObject> {
		const { method } = message.payload;

		try {
			if (method.startsWith('accessor:')) {
				return await this.handleAccessorMessage(message);
			}

			return await this.handleBridgeMessage(message);
		} catch (e) {
			return jsonrpc.error(message.payload.id, new jsonrpc.JsonRpcError(e.message, 1000));
		}
	}
}
