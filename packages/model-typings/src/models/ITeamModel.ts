import type { ITeam, TEAM_TYPE } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, UpdateResult, DeleteResult, Filter, Document } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ITeamModel extends IBaseModel<ITeam> {
	findByNames(names: Array<string>): FindCursor<ITeam>;

	findByNames(names: Array<string>, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByNames<P extends Document>(names: Array<string>, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByNames<P extends Document>(
		names: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findByIds(ids: Array<string>, query?: Filter<ITeam>): FindCursor<ITeam>;

	findByIds(ids: Array<string>, options: FindOptions<ITeam>, query?: Filter<ITeam>): FindCursor<ITeam>;

	findByIds<P extends Document>(
		ids: Array<string>,
		options: FindOptions<P extends ITeam ? ITeam : P>,
		query?: Filter<ITeam>,
	): FindCursor<P>;

	findByIds<P extends Document>(
		ids: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
		query?: Filter<ITeam>,
	): FindCursor<P> | FindCursor<ITeam>;

	findByIdsPaginated(ids: Array<string>, options?: undefined | FindOptions<ITeam>, query?: Filter<ITeam>): FindPaginated<FindCursor<ITeam>>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE): FindCursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TEAM_TYPE,
		options: FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TEAM_TYPE,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findByType(type: number): FindCursor<ITeam>;

	findByType(type: number, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByType<P extends Document>(type: number, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByType<P extends Document>(
		type: number,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<ITeam> | FindCursor<P>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>): FindCursor<ITeam>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByNameAndTeamIds<P extends Document>(
		name: string | RegExp,
		teamIds: Array<string>,
		options: FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P>;

	findByNameAndTeamIds<P extends Document>(
		name: string | RegExp,
		teamIds: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findOneByName(name: string | RegExp): Promise<ITeam | null>;

	findOneByName(name: string | RegExp, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByName<P extends Document>(name: string | RegExp, options: FindOptions<P>): Promise<P | null>;

	findOneByName<P extends Document>(
		name: string | RegExp,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string): Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByMainRoomId<P extends Document>(roomId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByMainRoomId<P extends Document>(
		roomId: string,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateResult>;

	deleteOneById(id: string): Promise<DeleteResult>;

	deleteOneByName(name: string): Promise<DeleteResult>;

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TEAM_TYPE }): Promise<UpdateResult>;
}
