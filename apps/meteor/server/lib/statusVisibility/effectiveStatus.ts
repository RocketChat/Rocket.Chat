import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

import type { PresenceScope } from './presenceScope';
import { hiddenIds } from './presenceScope';

const MATCHES_NOTHING = { __presenceHidden: { $exists: true } } as unknown as Filter<IUser>;

const hiddenStatusFilter = (status: UserStatus[], hidden: IUser['_id'][]): Filter<IUser> => {
	if (!hidden.length) {
		return { status: { $in: status } };
	}

	if (status.includes(UserStatus.OFFLINE)) {
		return { $or: [{ _id: { $nin: hidden }, status: { $in: status } }, { _id: { $in: hidden } }] };
	}

	return { $and: [{ _id: { $nin: hidden } }, { status: { $in: status } }] };
};

export const effectiveStatusFilter = (status: UserStatus[], scope: PresenceScope): Filter<IUser> => {
	if (scope.hideAll) {
		return status.includes(UserStatus.OFFLINE) ? {} : MATCHES_NOTHING;
	}

	return hiddenStatusFilter(status, hiddenIds(scope));
};

export const effectiveStatusExpression = (scope: PresenceScope) => {
	if (scope.hideAll) {
		return UserStatus.OFFLINE;
	}

	const hidden = hiddenIds(scope);

	return hidden.length ? { $cond: [{ $in: ['$_id', hidden] }, UserStatus.OFFLINE, '$status'] } : '$status';
};

export const excludingOfflineFilter = (scope: PresenceScope): Filter<IUser> => {
	if (scope.hideAll) {
		return MATCHES_NOTHING;
	}

	const hidden = hiddenIds(scope);

	return hidden.length
		? { $and: [{ _id: { $nin: hidden } }, { status: { $ne: UserStatus.OFFLINE } }] }
		: { status: { $ne: UserStatus.OFFLINE } };
};
