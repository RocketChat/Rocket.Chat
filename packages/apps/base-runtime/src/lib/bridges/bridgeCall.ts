import { formatErrorResponse } from '../accessors/formatResponseErrorHandler';
import type * as Messenger from '../messenger';

/**
 * The host bridges reachable from inside the subprocess. Mirrors the getter surface the host
 * exposes on `AppBridges`, plus the engine-owned `getAppResourceBridge` (see
 * docs/base-runtime-accessor-consolidation.md §4).
 */
export type BridgeName =
	| 'getMessageBridge'
	| 'getRoomBridge'
	| 'getUserBridge'
	| 'getLivechatBridge'
	| 'getVideoConferenceBridge'
	| 'getHttpBridge'
	| 'getInternalBridge'
	| 'getPersistenceBridge'
	| 'getUploadBridge'
	| 'getCloudWorkspaceBridge'
	| 'getOAuthAppsBridge'
	| 'getContactBridge'
	| 'getThreadBridge'
	| 'getRoleBridge'
	| 'getExperimentalBridge'
	| 'getServerSettingBridge'
	| 'getEnvironmentalVariableBridge'
	| 'getSchedulerBridge'
	| 'getModerationBridge'
	| 'getEmailBridge'
	| 'getUiInteractionBridge'
	| 'getAppResourceBridge';

/**
 * Encode and dispatch a single host bridge call from inside the subprocess.
 *
 * Every accessor turns a call into a `bridges:<bridge>:<method>` JSON-RPC request whose `result` is
 * unwrapped for the caller; a rejected request is normalized through `formatErrorResponse`. This is
 * the single place that knows how a bridge call is encoded on the wire - historically each accessor
 * hand-rolled that string and the `sendRequest(...).then(r => r.result).catch(...)` boilerplate.
 *
 * Notes:
 *
 * - **It does NOT inject the `'APP_ID'` sentinel.** Caller identity is passed explicitly and
 *   positionally by each accessor, exactly as the host accessor did. Some appId params are
 *   app-supplied arguments rather than caller identity (e.g. `getModerationBridge`), so a blanket
 *   injection here would make the dangerous case the default. See the APP_ID exception list in
 *   docs/base-runtime-app-id-exceptions.md.
 * - **`method` is constrained to `do*` at compile time**, mirroring the host-side gate in
 *   `BaseRuntimeSubprocessController.handleBridgeMessage`.
 */
export function bridgeCall<T = unknown>(
	senderFn: typeof Messenger.sendRequest,
	bridge: BridgeName,
	method: `do${string}`,
	...params: unknown[]
): Promise<T> {
	return senderFn({ method: `bridges:${bridge}:${method}`, params })
		.then((response) => response.result as T)
		.catch((err) => {
			throw formatErrorResponse(err);
		});
}
