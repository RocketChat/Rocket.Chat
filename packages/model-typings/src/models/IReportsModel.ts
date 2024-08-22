import type { IReport, IMessage } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IReportsModel extends IBaseModel<IReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		userId: string,
	): ReturnType<IBaseModel<IReport>['insertOne']>;
}
