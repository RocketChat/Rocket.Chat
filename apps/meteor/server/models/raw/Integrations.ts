import type { IIntegration, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IBaseModel, IIntegrationsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindCursor, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class IntegrationsRaw extends BaseRaw<IIntegration> implements IIntegrationsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IIntegration>>) {
		super(db, 'integrations', trash);
	}

	protected modelIndexes(): IndexDescription[] {
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

	disableByUserId(userId: IIntegration['userId']): ReturnType<IBaseModel<IIntegration>['updateMany']> {
		return this.updateMany({ userId }, { $set: { enabled: false } });
	}

	findByUserId(userId: IIntegration['userId']): FindCursor<Pick<IIntegration, '_id'>> {
		return this.find({ userId }, { projection: { _id: 1 } });
	}

	findByChannels(channels: IIntegration['channel']): FindCursor<IIntegration> {
		return this.find({ channel: { $in: channels } });
	}
}
