import { formatErrorResponse } from '../accessors/formatResponseErrorHandler';
import type * as Messenger from '../messenger';

/**
 * The shape of a single remote bridge as seen from inside the subprocess: an
 * object whose only callable members are the host bridge's `do*` methods. Every
 * call is turned into a `bridges:<bridgeName>:<method>` JSON-RPC request and its
 * `result` is unwrapped for the caller.
 *
 * The template-literal index signature is what lets a faithfully-ported accessor
 * keep its original call shape (`this.bridge.doGetById(id, appId)`) while the
 * message-string construction lives here.
 */
export type RemoteBridge = {
	[method: `do${string}`]: (...params: unknown[]) => Promise<unknown>;
};

/**
 * A typed facade over the host bridge surface, for use by accessors running
 * inside the subprocess.
 *
 * Historically each runtime accessor hand-rolled its own `bridges:...` message
 * strings and its own `sendRequest(...).then(r => r.result).catch(formatErrorResponse)`
 * boilerplate. `RemoteBridges` centralizes both so that accessor code reads like
 * its host-side counterpart and there is exactly one place that knows how a
 * bridge call is encoded on the wire.
 *
 * Design notes:
 *
 * - **It does NOT auto-inject the `'APP_ID'` sentinel.** Caller identity is
 *   passed explicitly and positionally by each accessor, exactly as the host
 *   accessor did. Centralizing the injection here would make the argument-appId
 *   exceptions (e.g. `ModerationBridge`, where the appId is an app-supplied
 *   argument, not caller identity) the dangerous default. See the APP_ID
 *   exception list in the migration doc.
 * - **Only `do*` methods may be called.** This mirrors the host-side gate in
 *   `BaseRuntimeSubprocessController.handleBridgeMessage`, but fails fast inside
 *   the subprocess instead of after a doomed round-trip.
 */
export class RemoteBridges {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	private buildBridge(bridgeName: string): RemoteBridge {
		const handler: ProxyHandler<Record<string, unknown>> = {
			get: (_target: unknown, prop: string | symbol) => {
				// Symbols (Symbol.toPrimitive, util.inspect.custom, ...) and the
				// thenable/serialization probes are not bridge methods; returning
				// undefined keeps the proxy from masquerading as a promise or
				// throwing during incidental inspection.
				if (typeof prop !== 'string' || prop === 'then' || prop === 'catch' || prop === 'finally' || prop === 'toJSON') {
					return undefined;
				}

				if (!prop.startsWith('do')) {
					throw new Error(`Invalid bridge method "${prop}" on "${bridgeName}": only "do*" methods can be called`);
				}

				return (...params: unknown[]): Promise<unknown> =>
					this.senderFn({
						method: `bridges:${bridgeName}:${prop}`,
						params,
					})
						.then((response) => response.result)
						.catch((err) => {
							throw formatErrorResponse(err);
						});
			},
		};

		return new Proxy({}, handler) as unknown as RemoteBridge;
	}

	public getMessageBridge(): RemoteBridge {
		return this.buildBridge('getMessageBridge');
	}

	public getRoomBridge(): RemoteBridge {
		return this.buildBridge('getRoomBridge');
	}

	public getUserBridge(): RemoteBridge {
		return this.buildBridge('getUserBridge');
	}

	public getLivechatBridge(): RemoteBridge {
		return this.buildBridge('getLivechatBridge');
	}

	public getVideoConferenceBridge(): RemoteBridge {
		return this.buildBridge('getVideoConferenceBridge');
	}

	public getHttpBridge(): RemoteBridge {
		return this.buildBridge('getHttpBridge');
	}

	public getInternalBridge(): RemoteBridge {
		return this.buildBridge('getInternalBridge');
	}

	public getPersistenceBridge(): RemoteBridge {
		return this.buildBridge('getPersistenceBridge');
	}

	public getUploadBridge(): RemoteBridge {
		return this.buildBridge('getUploadBridge');
	}

	public getCloudWorkspaceBridge(): RemoteBridge {
		return this.buildBridge('getCloudWorkspaceBridge');
	}

	public getOAuthAppsBridge(): RemoteBridge {
		return this.buildBridge('getOAuthAppsBridge');
	}

	public getContactBridge(): RemoteBridge {
		return this.buildBridge('getContactBridge');
	}

	public getThreadBridge(): RemoteBridge {
		return this.buildBridge('getThreadBridge');
	}

	public getRoleBridge(): RemoteBridge {
		return this.buildBridge('getRoleBridge');
	}

	public getExperimentalBridge(): RemoteBridge {
		return this.buildBridge('getExperimentalBridge');
	}

	public getServerSettingBridge(): RemoteBridge {
		return this.buildBridge('getServerSettingBridge');
	}

	public getEnvironmentalVariableBridge(): RemoteBridge {
		return this.buildBridge('getEnvironmentalVariableBridge');
	}

	public getSchedulerBridge(): RemoteBridge {
		return this.buildBridge('getSchedulerBridge');
	}

	public getModerationBridge(): RemoteBridge {
		return this.buildBridge('getModerationBridge');
	}

	public getEmailBridge(): RemoteBridge {
		return this.buildBridge('getEmailBridge');
	}

	public getUiInteractionBridge(): RemoteBridge {
		return this.buildBridge('getUiInteractionBridge');
	}

	/**
	 * The internal bridge that fronts host manager registries and the app's settings storage
	 * (slash commands, APIs, scheduler, UI buttons, providers, external components, app settings).
	 * It is not part of the app-facing `AppBridges` surface; the host resolves it via a dedicated
	 * lookup in `handleBridgeMessage`. See docs/base-runtime-accessor-consolidation.md §4.
	 */
	public getAppResourceBridge(): RemoteBridge {
		return this.buildBridge('getAppResourceBridge');
	}
}
