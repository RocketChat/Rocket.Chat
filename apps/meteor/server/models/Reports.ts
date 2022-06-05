import type { IReport, IMessage } from '@rocket.chat/core-typings';
import type { IReportsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class Reports extends ModelClass<IReport> implements IReportsModel {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		userId: string,
	): ReturnType<ModelClass<IReport>['insertOne']> {
		const record: Pick<IReport, 'message' | 'description' | 'ts' | 'userId'> = {
			message,
			description,
			ts: new Date(),
			userId,
		};
		return this.insertOne(record);
	}
}

const col = db.collection(`${prefix}reports`);
registerModel('IReportsModel', new Reports(col, trashCollection) as IReportsModel);
