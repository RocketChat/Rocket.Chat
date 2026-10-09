import crypto from 'node:crypto';

import type { IInvite, IInviteSummary, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IInvitesModel } from '@rocket.chat/model-typings';
import type { ClientSession, Collection, Db, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class InvitesRaw extends BaseRaw<IInvite> implements IInvitesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IInvite>>) {
		super(db, 'invites', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { inviteToken: 1 }, unique: true, partialFilterExpression: { inviteToken: { $type: 'string' } } }];
	}

	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<IInvite | null> {
		return this.findOne({
			rid,
			userId,
			days: daysToExpire,
			maxUses,
			legacy: { $ne: true },
			inviteToken: { $type: 'string' },
			$or: [{ expires: null }, { expires: { $gt: new Date() } }],
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

	findInvitesForManagement(): FindCursor<IInviteSummary> {
		return this.find<IInviteSummary>(
			{},
			{
				projection: {
					_id: 1,
					_updatedAt: 1,
					rid: 1,
					userId: 1,
					createdAt: 1,
					expires: 1,
					days: 1,
					maxUses: 1,
					uses: 1,
					legacy: 1,
				},
			},
		);
	}

	async migrateLegacyInvite(_id: string, expiresAt: Date, session: ClientSession): Promise<void> {
		if (!session.inTransaction()) {
			throw new Error('Legacy invite migration requires a transaction');
		}

		const invite = await this.col.findOne({ _id, inviteToken: { $exists: false } }, { session });
		if (!invite) {
			return;
		}

		await this.col.insertOne(
			{
				...invite,
				_id: crypto.randomUUID(),
				inviteToken: invite._id,
				legacy: true,
				expires: invite.expires ?? expiresAt,
				url: '',
			},
			{ session },
		);
		await this.col.deleteOne({ _id: invite._id }, { session });
	}
}
