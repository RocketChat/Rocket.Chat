import { Collection, FindOneOptions, Cursor, InsertOneWriteOpResult, UpdateWriteOpResult, DeleteWriteOpResultObject } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITeamMember } from '../../../../definition/ITeam';
import { IUser } from '../../../../definition/IUser';

type T = ITeamMember;
export class TeamMemberRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { teamId: 1 } },
		]);

		// teamId => userId should be unique
		this.col.createIndex({ teamId: 1, userId: 1 }, { unique: true });
	}

	findByUserId(userId: string, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ userId }, options);
	}

	findOneByUserIdAndTeamId(userId: string, teamId: string, options?: FindOneOptions<T>): Promise<T | null> {
		return this.col.findOne({ userId, teamId }, options);
	}

	findByTeamId(teamId: string, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ teamId }, options);
	}

	findByTeamIdAndRoles(teamId: string, roles?: string[], options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ teamId, roles }, options);
	}

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<T>): Promise<UpdateWriteOpResult> {
		return this.col.updateOne({ userId, teamId }, { $set: update });
	}

	createOneByTeamIdAndUserId(teamId: string, userId: string, createdBy: Pick<IUser, '_id' | 'username'>): Promise<InsertOneWriteOpResult<T>> {
		return this.insertOne({
			teamId,
			userId,
			createdAt: new Date(),
			_updatedAt: new Date(),
			createdBy,
		});
	}

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<string>): Promise<UpdateWriteOpResult> {
		return this.col.updateOne({
			teamId,
			userId,
		}, {
			$addToSet: {
				roles: { $each: roles },
			},
		});
	}

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<string>): Promise<UpdateWriteOpResult> {
		return this.col.updateOne({
			teamId,
			userId,
		}, {
			$pull: {
				roles: { $in: roles },
			},
		});
	}

	deleteByUserIdAndTeamId(userId: string, teamId: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({
			teamId,
			userId,
		});
	}
}
