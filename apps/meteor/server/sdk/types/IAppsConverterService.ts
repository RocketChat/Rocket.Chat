import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

export interface IAppsConverterService {
	convertRoomById(id: string): Promise<IRoom>;
	convertMessageById(id: string): Promise<IMessage>;
	convertVistitorByToken(id: string): Promise<IVisitor>;
	convertUserToApp(user: any): Promise<IUser>;
}
