import type { IndexSpecification } from 'mongodb';
import type { IIntegration, IUser } from '@rocket.chat/core-typings';
import type { IBaseModel, IIntegrationsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class Integrations extends ModelClass<IIntegration> implements IIntegrationsModel {
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

const col = db.collection(`${prefix}integrations`);
registerModel('IIntegrationsModel', new Integrations(col, trashCollection));
