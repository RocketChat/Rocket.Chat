import { Collection, FindOneOptions, Cursor, InsertOneWriteOpResult, UpdateWriteOpResult, DeleteWriteOpResultObject, FilterQuery } from 'mongodb';

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

	findByTeamIds(teamIds: Array<string>, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ teamId: { $in: teamIds } }, options);
	}

	findByTeamIdAndRole(teamId: string, role?: string, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ teamId, roles: role }, options);
	}

	findByUserIdAndTeamIds(userId: string, teamIds: Array<string>, options: FindOneOptions<T> = {}): Cursor<T> {
		const query = {
			'u._id': userId,
			teamId: {
				$in: teamIds,
			},
		};

		return this.col.find(query, options);
	}

	findMembersInfoByTeamId(teamId: string, limit: number, skip: number, query?: FilterQuery<T>): Cursor<T> {
		return this.col.find({ ...query, teamId }, {
			limit,
			skip,
			projection: {
				userId: 1,
				roles: 1,
				createdBy: 1,
				createdAt: 1,
			},
		} as FindOneOptions<T>);
	}

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<T>): Promise<UpdateWriteOpResult> {
		return this.updateOne({ userId, teamId }, { $set: update });
	}

	createOneByTeamIdAndUserId(teamId: string, userId: string, createdBy: Pick<IUser, '_id' | 'username'>): Promise<InsertOneWriteOpResult<T>> {
		return this.insertOne({
			teamId,
			userId,
			createdAt: new Date(),
			createdBy,
		});
	}

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<string>): Promise<UpdateWriteOpResult> {
		return this.updateOne({
			teamId,
			userId,
		}, {
			$addToSet: {
				roles: { $each: roles },
			},
		});
	}

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<string>): Promise<UpdateWriteOpResult> {
		return this.updateOne({
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

	deleteByTeamId(teamId: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteMany({
			teamId,
		});
	}
}
