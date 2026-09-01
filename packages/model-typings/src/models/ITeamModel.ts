import type { ITeam, TeamType } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult, DeleteResult, Filter, Document, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ITeamModel extends IBaseModel<ITeam> {
	findByNames(names: Array<string>): FindCursor<ITeam>;

	findByNames(names: Array<string>, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByNames<P extends Document>(names: Array<string>, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByNames<P extends Document>(
		names: Array<string>,
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findByIds<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		ids: Array<string>,
		options?: O,
		query?: Filter<ITeam>,
	): FindCursor<DocumentWithProjection<P, O>>;

	findByIdsPaginated<T extends Document = ITeam, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		ids: Array<string>,
		options?: O,
		query?: Filter<ITeam>,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findByIdsAndType(ids: Array<string>, type: TeamType): FindCursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TeamType, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TeamType,
		options: FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TeamType,
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findByType(type: number): FindCursor<ITeam>;

	findByType(type: number, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByType<P extends Document>(type: number, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByType<P extends Document>(
		type: number,
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
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
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam>;

	findOneByName(name: string | RegExp): Promise<ITeam | null>;

	findOneByName(name: string | RegExp, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByName<P extends Document>(name: string | RegExp, options: FindOptions<P>): Promise<P | null>;

	findOneByName<P extends Document>(
		name: string | RegExp,
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string): Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByMainRoomId<P extends Document>(roomId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByMainRoomId<P extends Document>(
		roomId: string,
		options?: FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null>;

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateResult>;

	deleteOneById(id: string): Promise<DeleteResult>;

	deleteOneByName(name: string): Promise<DeleteResult>;

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TeamType }): Promise<UpdateResult>;
}
