import type { IIntegration, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	IBaseModel,
	IIntegrationsModel,
	IntegrationsStatistics,
	DocumentWithProjection,
	FindOptionsWithProjection,
} from '@rocket.chat/model-typings';
import type { AggregateOptions, Collection, Db, FindCursor, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class IntegrationsRaw extends BaseRaw<IIntegration> implements IIntegrationsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IIntegration>>) {
		super(db, 'integrations', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { type: 1 } }];
	}

	findOneByUrl(url: string): Promise<IIntegration | null> {
		return this.findOne({ url });
	}

	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<IBaseModel<IIntegration>['updateMany']> {
		const hashedOldRoomName = `#${oldRoomName}`;
		const hashedNewRoomName = `#${newRoomName}`;

		return this.updateMany(
			{
				channel: hashedOldRoomName,
			},
			{
				$set: {
					'channel.$': hashedNewRoomName,
				},
			},
		);
	}

	findOneByIdAndCreatedByIfExists({
		_id,
		createdBy,
	}: {
		_id: IIntegration['_id'];
		createdBy?: IUser['_id'];
	}): Promise<IIntegration | null> {
		return this.findOne({
			_id,
			...(createdBy && { '_createdBy._id': createdBy }),
		});
	}

	removeByIdAndCreatedByIfExists({ _id, createdBy }: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null> {
		return this.findOneAndDelete({
			_id,
			...(createdBy && { '_createdBy._id': createdBy }),
		});
	}

	disableByUserId(userId: IIntegration['userId']): ReturnType<IBaseModel<IIntegration>['updateMany']> {
		return this.updateMany({ userId }, { $set: { enabled: false } });
	}

	findByUserId(userId: IIntegration['userId']): FindCursor<Pick<IIntegration, '_id'>> {
		return this.find({ userId }, { projection: { _id: 1 } });
	}

	findByChannels(channels: IIntegration['channel']): FindCursor<IIntegration> {
		return this.find({ channel: { $in: channels } });
	}

	findOneByIdAndToken<P extends Document = IIntegration, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		id: IIntegration['_id'],
		token: string,
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ _id: id, token }, options);
	}

	async getStatistics(options?: AggregateOptions): Promise<IntegrationsStatistics> {
		const results = await this.col
			.aggregate<{ _id: IIntegration['type']; total: number; active: number; scriptEnabled: number }>(
				[
					{
						$group: {
							_id: '$type',
							total: { $sum: 1 },
							active: { $sum: { $cond: ['$enabled', 1, 0] } },
							scriptEnabled: { $sum: { $cond: ['$scriptEnabled', 1, 0] } },
						},
					},
				],
				options,
			)
			.toArray();

		const statistics: IntegrationsStatistics = {
			totalIntegrations: 0,
			totalIncoming: 0,
			totalIncomingActive: 0,
			totalOutgoing: 0,
			totalOutgoingActive: 0,
			totalWithScriptEnabled: 0,
		};

		for (const { _id, total, active, scriptEnabled } of results) {
			statistics.totalIntegrations += total;
			statistics.totalWithScriptEnabled += scriptEnabled;

			if (_id === 'webhook-incoming') {
				statistics.totalIncoming += total;
				statistics.totalIncomingActive += active;
			} else if (_id === 'webhook-outgoing') {
				statistics.totalOutgoing += total;
				statistics.totalOutgoingActive += active;
			}
		}

		return statistics;
	}
}
