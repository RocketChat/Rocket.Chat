import type { IRoom, ISubscription, IUser, IFederationEvent } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IFederationRoomEventsModel extends IBaseModel<IFederationEvent> {
	createGenesisEvent(origin: string, room: IRoom): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createDeleteRoomEvent(origin: string, roomId: string): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createAddUserEvent(
		origin: string,
		roomId: string,
		user: IUser,
		subscription: ISubscription,
		domainsAfterAdd: string[],
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createRemoveUserEvent(
		origin: string,
		roomId: string,
		user: IUser,
		domainsAfterRemoval: string[],
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createUserLeftEvent(
		origin: string,
		roomId: string,
		user: IUser,
		domainsAfterLeave: string[],
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createMessageEvent(origin: string, roomId: string, message: string): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createEditMessageEvent(
		origin: string,
		roomId: string,
		originalMessage: { _id: string; msg: string; federation: Record<string, unknown> },
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createDeleteMessageEvent(origin: string, roomId: string, messageId: string): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createSetMessageReactionEvent(
		origin: string,
		roomId: string,
		messageId: string,
		username: string,
		reaction: string,
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createUnsetMessageReactionEvent(
		origin: string,
		roomId: string,
		messageId: string,
		username: string,
		reaction: string,
	): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createMuteUserEvent(origin: string, roomId: string, user: IUser): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	createUnmuteUserEvent(origin: string, roomId: string, user: IUser): Promise<Omit<IFederationEvent, '_updatedAt'>>;
	removeRoomEvents(roomId: string): Promise<DeleteResult>;
}
