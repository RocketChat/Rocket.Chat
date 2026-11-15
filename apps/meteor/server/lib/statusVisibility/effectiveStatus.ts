import type { PresenceScope } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { hiddenIds } from '@rocket.chat/streamer';
import type { Filter } from 'mongodb';

const matchesNobody = (): Filter<IUser> => ({ $nor: [{}] });

export const effectiveStatusFilter = (status: UserStatus[], hidden: PresenceScope): Filter<IUser> => {
	if (hidden.hideAll) {
		return status.includes(UserStatus.OFFLINE) ? {} : matchesNobody();
	}

	const ids = hiddenIds(hidden);

	if (!ids.length) {
		return { status: { $in: status } };
	}

	if (status.includes(UserStatus.OFFLINE)) {
		return { $or: [{ _id: { $nin: ids }, status: { $in: status } }, { _id: { $in: ids } }] };
	}

	return { $and: [{ _id: { $nin: ids } }, { status: { $in: status } }] };
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
		return matchesNobody();
	}

	const ids = hiddenIds(hidden);

	return ids.length ? { _id: { $nin: ids } } : {};
};

export const excludingOfflineFilter = (hidden: PresenceScope): Filter<IUser> => {
	if (hidden.hideAll) {
		return matchesNobody();
	}

	const ids = hiddenIds(hidden);

	return ids.length ? { $and: [{ _id: { $nin: ids } }, { status: { $ne: UserStatus.OFFLINE } }] } : { status: { $ne: UserStatus.OFFLINE } };
};
