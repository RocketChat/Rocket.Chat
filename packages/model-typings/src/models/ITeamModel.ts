import type { WithoutProjection, FindOneOptions, Cursor, UpdateWriteOpResult, DeleteWriteOpResultObject, FilterQuery } from 'mongodb';
import type { ITeam, TEAM_TYPE } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ITeamModel extends IBaseModel<ITeam> {
	findByNames(names: Array<string>): Cursor<ITeam>;

	findByNames(names: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByNames<P>(names: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByNames<P>(
		names: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Cursor<P> | Cursor<ITeam>;

	findByIds(ids: Array<string>, query?: FilterQuery<ITeam>): Cursor<ITeam>;

	findByIds(ids: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>, query?: FilterQuery<ITeam>): Cursor<ITeam>;

	findByIds<P>(ids: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>, query?: FilterQuery<ITeam>): Cursor<P>;

	findByIds<P>(
		ids: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
		query?: FilterQuery<ITeam>,
	): Cursor<P> | Cursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE): Cursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByIdsAndType<P>(ids: Array<string>, type: TEAM_TYPE, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByIdsAndType<P>(
		ids: Array<string>,
		type: TEAM_TYPE,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Cursor<P> | Cursor<ITeam>;

	findByType(type: number): Cursor<ITeam>;

	findByType(type: number, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByType<P>(type: number, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByType<P>(
		type: number,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Cursor<ITeam> | Cursor<P>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>): Cursor<ITeam>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByNameAndTeamIds<P>(name: string | RegExp, teamIds: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByNameAndTeamIds<P>(
		name: string | RegExp,
		teamIds: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Cursor<P> | Cursor<ITeam>;

	findOneByName(name: string | RegExp): Promise<ITeam | null>;

	findOneByName(name: string | RegExp, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam | null>;

	findOneByName<P>(name: string | RegExp, options: FindOneOptions<P>): Promise<P | null>;

	findOneByName<P>(
		name: string | RegExp,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string): Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam | null>;

	findOneByMainRoomId<P>(roomId: string, options: FindOneOptions<P>): Promise<P | null>;

	findOneByMainRoomId<P>(
		roomId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateWriteOpResult>;

	deleteOneById(id: string): Promise<DeleteWriteOpResultObject>;

	deleteOneByName(name: string): Promise<DeleteWriteOpResultObject>;

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TEAM_TYPE }): Promise<UpdateWriteOpResult>;
}
