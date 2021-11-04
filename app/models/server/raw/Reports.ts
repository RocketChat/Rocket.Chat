import { BaseRaw } from './BaseRaw';
import { IReport } from '../../../../definition/IReport';
import { IMessage } from '../../../../definition/IMessage';

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
