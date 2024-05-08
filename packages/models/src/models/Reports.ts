import type { IMessage, IReport, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReportsModel } from '@rocket.chat/model-typings';
import type { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ReportsRaw extends BaseRaw<IReport> implements IReportsModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<IReport>>) {
		super('reports', trash);
	}

	createWithMessageDescriptionAndUserId(message: IMessage, description: string, userId: string): ReturnType<BaseRaw<IReport>['insertOne']> {
		const record: Pick<IReport, 'message' | 'description' | 'ts' | 'userId'> = {
			message,
			description,
			ts: new Date(),
			userId,
		};
		return this.insertOne(record);
	}
}
