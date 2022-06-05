import type { IReport, IMessage } from '@rocket.chat/core-typings';
import type { IReportsModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class ReportsRaw extends ModelClass<IReport> implements IReportsModel {
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
