import type { IUser, IUserSessionConnection } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

export type ClaimUpdate =
	| { type: 'setActive'; newState: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId'> }
	| { type: 'endActive'; statusId?: string }
	| { type: 'clearActive' };

// Priority: internal > manual > external (lower number = higher priority).
// System states (like auto-away) are not listed here and have the lowest priority.
const PRIORITY = { internal: 1, manual: 2, external: 3 };
const NO_PRIORITY = 4;

const RESET_TO_ONLINE = {
	set: { statusDefault: UserStatus.ONLINE, statusText: '' },
	unset: ['statusSource', 'statusExpiresAt', 'previousState', 'statusId'],
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

function disconnectedStatus(claimType: ClaimUpdate['type'], isServiceUser: boolean, statusDefault: UserStatus): UserStatus {
	switch (claimType) {
		case 'clearActive':
			return statusDefault;
		case 'setActive':
			return isServiceUser ? statusDefault : UserStatus.OFFLINE;
		case 'endActive':
			return UserStatus.OFFLINE;
	}
}

/**
 * Resolves a claim update against the user's current state using the priority system.
 * Returns the DB fields to set/unset, or null if the claim is rejected.
 */
function resolveIntent(
	user: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId' | 'previousState'>,
	claimUpdate: ClaimUpdate,
): { set: Record<string, unknown> & { statusDefault?: UserStatus }; unset: string[] } | null {
	const currentStatusDefault = user.statusDefault ?? UserStatus.ONLINE;

	if (claimUpdate.type === 'clearActive') {
		return RESET_TO_ONLINE;
	}

	if (claimUpdate.type === 'endActive') {
		const { statusId } = claimUpdate;
		if (statusId) {
			const matchesActive = user.statusId === statusId;
			const matchesStash = user.previousState?.statusId === statusId;
			// stashed claim ended: drop it, keep displaying the still-active claim
			if (matchesStash && !matchesActive) {
				return { set: {}, unset: ['previousState'] };
			}
			if (!matchesActive && !matchesStash) {
				return null;
			}
		}
		if (user.previousState && !isExpired(user.previousState.statusExpiresAt)) {
			const prev = user.previousState;
			return {
				set: {
					statusDefault: prev.statusDefault,
					statusSource: prev.statusSource,
					...(prev.statusText != null && { statusText: prev.statusText }),
					...(prev.statusExpiresAt && { statusExpiresAt: prev.statusExpiresAt }),
					...(prev.statusId && { statusId: prev.statusId }),
				},
				unset: fieldsToUnset(prev, prev.statusId ? ['previousState'] : ['previousState', 'statusId']),
			};
		}
		return RESET_TO_ONLINE;
	}

	// type === 'setActive'
	const { newState } = claimUpdate;
	const { statusId } = newState;

	// offline users can only have their status changed by manual sources
	if (currentStatusDefault === UserStatus.OFFLINE && newState.statusSource !== 'manual') {
		return null;
	}

	const currentPriority = user.statusSource ? PRIORITY[user.statusSource] : NO_PRIORITY;
	const newPriority = newState.statusSource ? PRIORITY[newState.statusSource] : NO_PRIORITY;

	// manual is the user's explicit intent: it never stashes and clears any queued claim
	const isManual = newState.statusSource === 'manual';

	// higher or equal priority -> apply new; equal-priority internals (voice + video) stash so statusId
	// can restore either order. Single slot: a 3rd concurrent internal claim evicts the oldest.
	if (newPriority <= currentPriority) {
		// re-applying the same non-stacking source (calendar) updates in place; only internal stacks
		const sameSourceReapply = user.statusSource === newState.statusSource;
		const sourceStacks = newState.statusSource === 'internal';
		const shouldStash = !isManual && Boolean(user.statusSource) && (!sameSourceReapply || sourceStacks);

		const previousState = shouldStash
			? {
					statusDefault: currentStatusDefault,
					statusText: user.statusText ?? '',
					statusSource: user.statusSource,
					statusExpiresAt: user.statusExpiresAt,
					...(user.statusId && { statusId: user.statusId }),
				}
			: undefined;

		return {
			set: {
				statusDefault: newState.statusDefault,
				statusSource: newState.statusSource,
				...(newState.statusText != null && { statusText: newState.statusText }),
				...(newState.statusExpiresAt && { statusExpiresAt: newState.statusExpiresAt }),
				...(statusId && { statusId }),
				...(previousState && { previousState }),
			},
			unset: fieldsToUnset(newState, [...(isManual ? ['previousState'] : []), ...(statusId ? [] : ['statusId'])]),
		};
	}

	const previousState = {
		statusDefault: newState.statusDefault,
		statusSource: newState.statusSource,
		...(newState.statusText != null && { statusText: newState.statusText }),
		...(newState.statusExpiresAt && { statusExpiresAt: newState.statusExpiresAt }),
		...(statusId && { statusId }),
	};

	// lower priority -> save as previous if slot available
	if (!user.previousState || isExpired(user.previousState.statusExpiresAt)) {
		return {
			set: { previousState },
			unset: [],
		};
	}

	if (
		newState.statusSource &&
		user.previousState.statusSource &&
		PRIORITY[newState.statusSource] <= PRIORITY[user.previousState.statusSource]
	) {
		return {
			set: { previousState },
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
	user: Pick<IUser, 'type' | 'roles' | 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId' | 'previousState'>,
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

	// no live connection: humans fall back to offline; bots/apps keep their declared status
	if (!sessions.length) {
		const isServiceUser = user.type === 'bot' || user.type === 'app' || (user.roles?.includes('bot') ?? false);
		const status = disconnectedStatus(claimUpdate.type, isServiceUser, statusDefault);
		return { values: { ...set, status, statusConnection: UserStatus.OFFLINE }, clear };
	}

	const statusConnection = sessions.map((s) => s.status).reduce(reduceConnections, UserStatus.OFFLINE);
	const status = computeStatus(statusConnection, statusDefault);
	return { values: { ...set, status, statusConnection }, clear };
}
