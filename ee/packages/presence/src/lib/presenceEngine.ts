import type { IUser, IUserSessionConnection } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

export type ClaimUpdate =
	| { type: 'setActive'; newState: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt'> }
	| { type: 'endActive' }
	| { type: 'clearActive' };

// Priority: internal > manual > external (lower number = higher priority).
// System states (like auto-away) are not listed here and have the lowest priority.
const PRIORITY = { internal: 1, manual: 2, external: 3 };
const NO_PRIORITY = 4;

const RESET_TO_ONLINE = {
	set: { statusDefault: UserStatus.ONLINE, statusText: '' },
	unset: ['statusSource', 'statusExpiresAt', 'previousState'],
};

function isExpired(expiresAt?: Date): boolean {
	return expiresAt != null && expiresAt.getTime() < Date.now();
}

function fieldsToUnset(state: Pick<IUser, 'statusExpiresAt'>, extra?: string[]): string[] {
	const fields = new Set(extra);
	if (!state.statusExpiresAt) {
		fields.add('statusExpiresAt');
	}
	return [...fields];
}

/** Reduces multiple DDP sessions into one status: ONLINE wins,
 * then first non-OFFLINE. */
function reduceConnections(current: UserStatus, status: UserStatus): UserStatus {
	if (current === UserStatus.ONLINE) {
		return UserStatus.ONLINE;
	}
	if (status !== UserStatus.OFFLINE) {
		return status;
	}
	return current;
}

/**
 * Resolves final display status: OFFLINE connection always wins,
 * explicit claims (busy/away) override connection, ONLINE defers to connection.
 */
function computeStatus(statusConnection: UserStatus, statusDefault: UserStatus): UserStatus {
	if (statusConnection === UserStatus.OFFLINE) {
		return UserStatus.OFFLINE;
	}
	if (statusDefault === UserStatus.ONLINE) {
		return statusConnection;
	}
	return statusDefault;
}

/**
 * Resolves a claim update against the user's current state using the priority system.
 * Returns the DB fields to set/unset, or null if the claim is rejected.
 */
function resolveIntent(
	user: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'previousState'>,
	claimUpdate: ClaimUpdate,
): { set: Record<string, unknown> & { statusDefault?: UserStatus }; unset: string[] } | null {
	const currentStatusDefault = user.statusDefault ?? UserStatus.ONLINE;

	if (claimUpdate.type === 'clearActive') {
		return RESET_TO_ONLINE;
	}

	if (claimUpdate.type === 'endActive') {
		if (user.previousState && !isExpired(user.previousState.statusExpiresAt)) {
			return {
				set: { ...user.previousState },
				unset: fieldsToUnset(user.previousState, ['previousState']),
			};
		}
		return RESET_TO_ONLINE;
	}

	// type === 'setActive'
	const { newState } = claimUpdate;

	// offline users can only have their status changed by manual sources
	if (currentStatusDefault === UserStatus.OFFLINE && newState.statusSource !== 'manual') {
		return null;
	}

	const currentPriority = user.statusSource ? PRIORITY[user.statusSource] : NO_PRIORITY;
	const newPriority = newState.statusSource ? PRIORITY[newState.statusSource] : NO_PRIORITY;

	// higher priority -> save current as previous and apply new
	if (newPriority < currentPriority) {
		const previousState = user.statusSource
			? {
					statusDefault: currentStatusDefault,
					statusText: user.statusText ?? '',
					statusSource: user.statusSource,
					statusExpiresAt: user.statusExpiresAt,
				}
			: undefined;

		return {
			set: { ...newState, ...(previousState && { previousState }) },
			unset: fieldsToUnset(newState),
		};
	}

	// same priority -> overwrite and keep previous
	if (newPriority === currentPriority) {
		return {
			set: { ...newState },
			unset: fieldsToUnset(newState),
		};
	}

	// lower priority -> save as previous if slot available
	if (!user.previousState || isExpired(user.previousState.statusExpiresAt)) {
		return {
			set: { previousState: newState },
			unset: [],
		};
	}

	if (
		newState.statusSource &&
		user.previousState.statusSource &&
		PRIORITY[newState.statusSource] <= PRIORITY[user.previousState.statusSource]
	) {
		return {
			set: { previousState: newState },
			unset: [],
		};
	}

	// rejected - can't store
	return null;
}

/**
 * Computes the final presence state for a user by combining claim intent with connection reality.
 * Returns the DB fields to $set and optionally $unset.
 */
export function processPresence(
	user: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'previousState'>,
	sessions: IUserSessionConnection[],
	claimUpdate?: ClaimUpdate,
): { values: Record<string, unknown>; clear?: string[] } {
	// no claim - status is determined entirely by DDP sessions
	if (!claimUpdate) {
		if (!sessions.length) {
			return { values: { status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE } };
		}
		const statusDefault = user.statusDefault ?? UserStatus.ONLINE;
		const statusConnection = sessions.map((s) => s.status).reduce(reduceConnections, UserStatus.OFFLINE);
		return { values: { status: computeStatus(statusConnection, statusDefault), statusConnection } };
	}

	const intent = resolveIntent(user, claimUpdate);
	if (!intent) {
		return { values: {} };
	}

	const { set, unset } = intent;
	const statusDefault = set.statusDefault ?? user.statusDefault ?? UserStatus.ONLINE;
	const clear = unset.length ? unset : undefined;

	// setActive with no DDP sessions: user is disconnected but holding a claim — persist
	// it for reconnect but display OFFLINE. Other types (clearActive/endActive) use
	// statusDefault so REST-only callers and bots can appear online.
	if (!sessions.length) {
		const status = claimUpdate.type === 'setActive' ? UserStatus.OFFLINE : statusDefault;
		return { values: { ...set, status, statusConnection: UserStatus.OFFLINE }, clear };
	}

	const statusConnection = sessions.map((s) => s.status).reduce(reduceConnections, UserStatus.OFFLINE);
	const status = computeStatus(statusConnection, statusDefault);
	return { values: { ...set, status, statusConnection }, clear };
}
