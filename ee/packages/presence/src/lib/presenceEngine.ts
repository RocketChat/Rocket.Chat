import { type IUser, UserStatus } from '@rocket.chat/core-typings';

const PRIORITY = { internal: 1, manual: 2, external: 3 };

const NO_PRIORITY = 4;

function isExpired(expiresAt?: Date): boolean {
	return expiresAt != null && expiresAt.getTime() < Date.now();
}

function fieldsToUnset(state: Pick<IUser, 'statusEmoji' | 'statusExpiresAt'>, extra?: string[]): string[] {
	const fields = new Set(extra);

	if (!state.statusEmoji) {
		fields.add('statusEmoji');
	}

	if (!state.statusExpiresAt) {
		fields.add('statusExpiresAt');
	}

	return [...fields];
}

export function setActive(
	user: IUser,
	newState: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusEmoji' | 'statusExpiresAt'>,
): { values: Record<string, unknown>; clear?: string[] } | null {
	if (user.statusDefault === UserStatus.OFFLINE && user.statusConnection !== UserStatus.OFFLINE && newState.statusSource !== 'manual') {
		return null;
	}

	const currentPriority = user.statusSource ? PRIORITY[user.statusSource] : NO_PRIORITY;
	const newPriority = newState.statusSource ? PRIORITY[newState.statusSource] : NO_PRIORITY;

	const values: Record<string, unknown> = { ...newState, status: newState.statusDefault };

	// Higher priority -> save current as previous, apply new
	if (newPriority < currentPriority) {
		const previousState = user.statusSource
			? {
					statusDefault: user.statusDefault ?? UserStatus.ONLINE,
					statusText: user.statusText ?? '',
					statusEmoji: user.statusEmoji,
					statusSource: user.statusSource,
					statusExpiresAt: user.statusExpiresAt,
				}
			: undefined;

		return {
			values: { ...values, ...(previousState && { previousState }) },
			clear: fieldsToUnset(newState),
		};
	}

	// Same priority -> overwrite, keep previous
	if (newPriority === currentPriority) {
		return { values, clear: fieldsToUnset(newState) };
	}

	// Lower priority -> save as previous if slot available
	if (!user.previousState || isExpired(user.previousState.statusExpiresAt)) {
		return { values: { previousState: newState } };
	}

	if (
		newState.statusSource &&
		user.previousState.statusSource &&
		PRIORITY[newState.statusSource] <= PRIORITY[user.previousState.statusSource]
	) {
		return { values: { previousState: newState } };
	}

	return null;
}

export function endActive(user: IUser) {
	if (user.previousState && !isExpired(user.previousState.statusExpiresAt)) {
		return {
			values: { ...user.previousState, status: user.previousState.statusDefault },
			clear: fieldsToUnset(user.previousState, ['previousState']),
		};
	}

	return {
		values: { status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE, statusText: '' },
		clear: ['statusEmoji', 'statusSource', 'statusExpiresAt', 'previousState'],
	};
}

export function clearActive() {
	return {
		values: { status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE, statusText: '' },
		clear: ['statusEmoji', 'statusSource', 'statusExpiresAt', 'previousState'],
	};
}
