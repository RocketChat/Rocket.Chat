import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IIntegration } from '../../../../definition/IIntegration';

export class IntegrationsRaw extends BaseRaw<IIntegration> {
	protected indexes: IndexSpecification[] = [{ key: { type: 1 } }];

	findOneByUrl(url: string): Promise<IIntegration | null> {
		return this.findOne({ url });
	}

	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<BaseRaw<IIntegration>['updateMany']> {
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
		createdBy: IIntegration['_createdBy'];
	}): Promise<IIntegration | null> {
		return this.findOne({
			_id,
			...(createdBy && { '_createdBy._id': createdBy }),
		});
	}

	disableByUserId(userId: string): ReturnType<BaseRaw<IIntegration>['updateMany']> {
		return this.updateMany({ userId }, { $set: { enabled: false } });
	}
}
