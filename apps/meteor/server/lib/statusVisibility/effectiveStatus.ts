import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

export const effectiveStatusFilter = (status: UserStatus[], hidden?: Set<IUser['_id']>): Filter<IUser> => {
	if (!hidden?.size) {
		return { status: { $in: status } };
	}

	const ids = [...hidden];

	if (status.includes(UserStatus.OFFLINE)) {
		return { $or: [{ _id: { $nin: ids }, status: { $in: status } }, { _id: { $in: ids } }] };
	}

	return { $and: [{ _id: { $nin: ids } }, { status: { $in: status } }] };
};

export const effectiveStatusExpression = (hidden: Set<IUser['_id']>) => ({
	$cond: [{ $in: ['$_id', [...hidden]] }, UserStatus.OFFLINE, '$status'],
});

export const excludingOfflineFilter = (hidden?: Set<IUser['_id']>): Filter<IUser> =>
	hidden?.size
		? { $and: [{ _id: { $nin: [...hidden] } }, { status: { $ne: UserStatus.OFFLINE } }] }
		: { status: { $ne: UserStatus.OFFLINE } };
