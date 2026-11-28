import type { IIntegration, IUser } from '@rocket.chat/core-typings';
import type { AggregateOptions, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export type IntegrationsStatistics = {
	totalIntegrations: number;
	totalIncoming: number;
	totalIncomingActive: number;
	totalOutgoing: number;
	totalOutgoingActive: number;
	totalWithScriptEnabled: number;
};

export interface IIntegrationsModel extends IBaseModel<IIntegration> {
	disableByUserId(userId: IIntegration['userId']): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findByChannels(channels: IIntegration['channel']): FindCursor<IIntegration>;
	findByUserId(userId: IIntegration['userId']): FindCursor<Pick<IIntegration, '_id'>>;
	findOneByIdAndCreatedByIfExists(params: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null>;
	removeByIdAndCreatedByIfExists(params: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null>;
	findOneByUrl(url: string): Promise<IIntegration | null>;
	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findOneByIdAndToken<P extends Document = IIntegration, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		id: IIntegration['_id'],
		token: string,
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	getStatistics(options?: AggregateOptions): Promise<IntegrationsStatistics>;
}
