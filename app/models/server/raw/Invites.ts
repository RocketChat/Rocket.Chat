import type { UpdateWriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IInvite } from '../../../../definition/IInvite';

type T = IInvite;

export class InvitesRaw extends BaseRaw<T> {
	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<T | null> {
		return this.findOne({
			rid,
			userId,
			days: daysToExpire,
			maxUses,
			...(daysToExpire > 0 ? { expires: { $gt: new Date() } } : {}),
			...(maxUses > 0 ? { uses: { $lt: maxUses } } : {}),
		});
	}

	increaseUsageById(_id: string, uses = 1): Promise<UpdateWriteOpResult> {
		return this.updateOne(
			{ _id },
			{
				$inc: {
					uses,
				},
			},
		);
	}
}
