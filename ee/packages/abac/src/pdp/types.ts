import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast, ISubscription } from '@rocket.chat/core-typings';

export interface IPolicyDecisionPoint {
	canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
		userSub: ISubscription,
		decisionCacheTimeout: number,
	): Promise<{ granted: boolean; userToRemove?: IUser }>;

	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void>;

	onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]>;

	onSubjectAttributesChanged(user: IUser, next: IAbacAttributeDefinition[]): Promise<IRoom[]>;
}
