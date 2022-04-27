import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IGameService, IGameCreateParams, IGame, IGameUpdateParams } from '../../../definition/IGame';
import { GamesRaw } from '../../../app/models/server/raw/Games';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { GameModel } from '../../../app/models/server/raw';

export class GameService extends ServiceClassInternal implements IGameService {
	protected name = 'game';

	private GameModel: GamesRaw;

	constructor(db: Db) {
		super();
	}

	async create(params: IGameCreateParams): Promise<IGame> {
		const createData: InsertionModel<IGame> = {
			...new CreateObject(),
			...params,
			...(params.tags ? { tags: params.tags } : { tags: [] }),
			...(params.ranking ? { ranking: params.ranking } : { ranking: 0 }),
		};
		const result = await GameModel.insertOne(createData);
		return GameModel.findOneById(result.insertedId);
	}

	async delete(gameId: string): Promise<void> {
		await this.getGame(gameId);
		await GameModel.removeById(gameId);
	}

	async getGame(gameId: string): Promise<IGame> {
		const game = await GameModel.findOneById(gameId);
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
		const result = await GameModel.updateOne(query, { $set: updateData });
		return GameModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IGame> = { sort: {} },
	): Promise<IRecordsWithTotal<IGame>> {
		const result = GameModel.find(
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
