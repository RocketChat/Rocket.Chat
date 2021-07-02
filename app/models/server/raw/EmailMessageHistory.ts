/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BaseRaw } from './BaseRaw';
import { IEmailMessageHistory } from '../../../../definition/IEmailMessageHistory';

export class EmailMessageHistoryRaw extends BaseRaw<IEmailMessageHistory> {
	insertOne({ _id, email }: IEmailMessageHistory) {
		return this.col.insertOne({
			_id,
			email,
			createdAt: new Date(),
		});
	}
}
