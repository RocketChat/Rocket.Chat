import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IGameService, IGameCreateParams, IGame } from '../../../definition/IGame';
import { GamesRaw } from '../../../app/models/server/raw/Games';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';

export class GameService extends ServiceClassInternal implements IGameService {
	protected name = 'game';

	private GameModel: GamesRaw;

	constructor(db: Db) {
		super();

		this.GameModel = new GamesRaw(db.collection('games'));
	}

	async create(params: IGameCreateParams): Promise<IGame> {
		const result = await this.GameModel.insertOne(params);
		return this.GameModel.findOneById(result.insertedId);
	}

	async delete(gameId: string): Promise<void> {
		const game = this.GameModel.findOneById(gameId);
		if (!game) {
			throw new Error('game-does-not-exist');
		}
		await this.GameModel.removeById(gameId);
	}

	async update(gameId: string, params: Partial<IGameCreateParams>): Promise<IGame> {
		const game = this.GameModel.findOneById(gameId);
		if (!game) {
			throw new Error('game-does-not-exist');
		}
		const query = {
			_id: gameId,
		};
		const result = await this.GameModel.updateOne(query, params);
		return this.GameModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IGame> = { sort: {} },
	): Promise<IRecordsWithTotal<IGame>> {
		const result = this.GameModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
		return {
			total: await result.count(),
			records: await result.toArray(),
		};
	}
}
