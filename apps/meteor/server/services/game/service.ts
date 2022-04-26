import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IGameService, IGameCreateParams, IGame, IGameUpdateParams } from '../../../definition/IGame';
import { GamesRaw } from '../../../app/models/server/raw/Games';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';

export class GameService extends ServiceClassInternal implements IGameService {
	protected name = 'game';

	private GameModel: GamesRaw;

	constructor(db: Db) {
		super();

		this.GameModel = new GamesRaw(db.collection('games'));
	}

	async create(params: IGameCreateParams): Promise<IGame> {
		const createData: InsertionModel<IGame> = {
			...new CreateObject(),
			...params,
			...(params.tags ? { tags: params.tags } : { tags: [] }),
			...(params.ranking ? { ranking: params.ranking } : { ranking: 0 }),
		};
		const result = await this.GameModel.insertOne(createData);
		return this.GameModel.findOneById(result.insertedId);
	}

	async delete(gameId: string): Promise<void> {
		await this.getGame(gameId);
		await this.GameModel.removeById(gameId);
	}

	async getGame(gameId: string): Promise<IGame> {
		const game = await this.GameModel.findOneById(gameId);
		if (!game) {
			throw new Error('game-does-not-exist');
		}
		return game;
	}

	async update(gameId: string, params: IGameUpdateParams): Promise<IGame> {
		await this.getGame(gameId);
		const query = {
			_id: gameId,
		};
		const updateData = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.GameModel.updateOne(query, updateData);
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
