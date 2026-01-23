import crypto from 'node:crypto';

import type { IInvite, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IInvitesModel } from '@rocket.chat/model-typings';
import type { Collection, Db, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class InvitesRaw extends BaseRaw<IInvite> implements IInvitesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IInvite>>) {
		super(db, 'invites', trash);
	}

	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<IInvite | null> {
		return this.findOne({
			rid,
			userId,
			days: daysToExpire,
			maxUses,
			...(daysToExpire > 0 ? { expires: { $gt: new Date() } } : {}),
			...(maxUses > 0 ? { uses: { $lt: maxUses } } : {}),
		});
	}

	findOneByInviteToken(inviteToken: string): Promise<IInvite | null> {
		return this.findOne({ inviteToken });
	}

	increaseUsageById(_id: string, uses = 1): Promise<UpdateResult> {
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
		const [result] = await this.col.aggregate<{ totalUses: number }>([{ $group: { _id: null, totalUses: { $sum: '$uses' } } }]).toArray();

		return result?.totalUses || 0;
	}

	async ensureInviteToken(_id: string): Promise<string> {
		const inviteToken = crypto.randomUUID();

		const result = await this.updateOne(
			{ _id, inviteToken: { $exists: false } },
			{ $set: { inviteToken } },
		);

		if (result.modifiedCount > 0) {
			return inviteToken;
		}

		const invite = await this.findOneById(_id, { projection: { inviteToken: 1 } });
		if (!invite) {
			throw new Error(`Invite with _id ${_id} not found`);
		}
		if (!invite.inviteToken) {
			throw new Error(`Invite with _id ${_id} exists but has no inviteToken`);
		}
		return invite.inviteToken;
	}
}
