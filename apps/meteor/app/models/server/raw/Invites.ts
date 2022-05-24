import type { UpdateWriteOpResult } from 'mongodb';
import type { IInvite } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

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

	async countUses(): Promise<number> {
		const [result] = await this.col
			.aggregate<{ totalUses: number } | undefined>([{ $group: { _id: null, totalUses: { $sum: '$uses' } } }])
			.toArray();

		return result?.totalUses || 0;
	}
}
