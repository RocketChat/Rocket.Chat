import type { IndexSpecification } from 'mongodb';
import type { IIntegration, IUser } from '@rocket.chat/core-typings';
import { ModelClass } from '@rocket.chat/models';
import type { IBaseModel } from '@rocket.chat/models';

export class Integrations extends ModelClass<IIntegration> {
	protected modelIndexes(): IndexSpecification[] {
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

	disableByUserId(userId: string): ReturnType<IBaseModel<IIntegration>['updateMany']> {
		return this.updateMany({ userId }, { $set: { enabled: false } });
	}
}
