import type { ITeam, TeamType } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult, DeleteResult, Filter, Document } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ITeamModel extends IBaseModel<ITeam> {
	findByNames<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(names: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	findByIds<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(ids: Array<string>, options?: O, query?: Filter<ITeam>): FindCursor<DocumentWithProjection<P, O>>;

	findByIdsPaginated<T extends Document = ITeam, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(ids: Array<string>, options?: O, query?: Filter<ITeam>): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findByIdsAndType<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(ids: Array<string>, type: TeamType, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	findByType<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(type: number, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	findByNameAndTeamIds<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(name: string | RegExp, teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	findOneByName<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(name: string | RegExp, options?: O): Promise<DocumentWithProjection<P, O> | null>;

	findOneByMainRoomId<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(roomId: string, options?: O): Promise<DocumentWithProjection<P, O> | null>;

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateResult>;

	deleteOneById(id: string): Promise<DeleteResult>;

	deleteOneByName(name: string): Promise<DeleteResult>;

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TeamType }): Promise<UpdateResult>;
}
