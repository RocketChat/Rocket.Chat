import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

import type { PresenceScope } from './presenceScope';
import { hiddenIds } from './presenceScope';

const hiddenStatusFilter = (status: UserStatus[], ids: IUser['_id'][]): Filter<IUser> => {
	if (!ids.length) {
		return { status: { $in: status } };
	}

	if (status.includes(UserStatus.OFFLINE)) {
		return { $or: [{ _id: { $nin: ids }, status: { $in: status } }, { _id: { $in: ids } }] };
	}

	return { $and: [{ _id: { $nin: ids } }, { status: { $in: status } }] };
};

export const effectiveStatusFilter = (status: UserStatus[], hidden: PresenceScope): Filter<IUser> => {
	if (hidden.hideAll) {
		return status.includes(UserStatus.OFFLINE) ? {} : { $nor: [{}] };
	}

	return hiddenStatusFilter(status, hiddenIds(hidden));
};

export const effectiveStatusExpression = (hidden: PresenceScope) => {
	if (hidden.hideAll) {
		return UserStatus.OFFLINE;
	}

	const ids = hiddenIds(hidden);

	return ids.length ? { $cond: [{ $in: ['$_id', ids] }, UserStatus.OFFLINE, '$status'] } : '$status';
};

export const excludingHiddenFilter = (hidden: PresenceScope): Filter<IUser> => {
	if (hidden.hideAll) {
		return { $nor: [{}] };
	}

	const ids = hiddenIds(hidden);

	return ids.length ? { _id: { $nin: ids } } : {};
};

export const excludingOfflineFilter = (hidden: PresenceScope): Filter<IUser> => {
	if (hidden.hideAll) {
		return { $nor: [{}] };
	}

	const ids = hiddenIds(hidden);

	return ids.length ? { $and: [{ _id: { $nin: ids } }, { status: { $ne: UserStatus.OFFLINE } }] } : { status: { $ne: UserStatus.OFFLINE } };
};
