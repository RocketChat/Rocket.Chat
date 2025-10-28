import type { IMessage } from '@rocket.chat/core-typings';

import type { IAppsMessage, IAppsRoom } from '../AppsEngine';
import type { IAppUsersConverter } from './IAppUsersConverter';

export interface IAppThreadsConverter {
	convertById(threadId: string): Promise<IAppsMessage[]>;
	convertMessage(
		msgObj: IMessage,
		room: IAppsRoom,
		convertUserById: IAppUsersConverter['convertById'],
		convertToApp: IAppUsersConverter['convertToApp'],
	): Promise<IAppsMessage>;
}
