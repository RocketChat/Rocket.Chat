import type { IReport, IMessage } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class ReportsRaw extends BaseRaw<IReport> {
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
