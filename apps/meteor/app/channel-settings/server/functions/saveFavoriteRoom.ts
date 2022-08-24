import type { UpdateResult } from 'mongodb';
import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

export const saveFavoriteRoom = function (rid: IRoom['_id'], uid: IUser['_id'], favorite?: boolean): Promise<UpdateResult> {
	return Subscriptions.updateOne(
		{
			rid,
			'u._id': uid,
		},
		{
			...(favorite && { $set: { f: true } }),
			...(!favorite && { $unset: { f: '' } }),
		},
	);
};
