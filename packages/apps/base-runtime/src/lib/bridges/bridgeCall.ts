import { formatErrorResponse } from '../accessors/formatResponseErrorHandler';
import type * as Messenger from '../messenger';

/** The host bridges reachable from inside the subprocess. */
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
 * Encode and dispatch a single host bridge call from inside the subprocess: a
 * `bridges:<bridge>:<method>` JSON-RPC request whose `result` is unwrapped for the caller, with a
 * rejection normalized through `formatErrorResponse`.
 *
 * It deliberately does NOT inject the `'APP_ID'` sentinel. Caller identity is passed explicitly and
 * positionally by each accessor, because on a few bridges the appId param is an app-supplied
 * argument rather than caller identity (e.g. `getModerationBridge`) - a blanket injection here would
 * make the dangerous case the default.
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
