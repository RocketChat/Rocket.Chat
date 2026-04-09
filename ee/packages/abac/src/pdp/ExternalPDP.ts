import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast, ISubscription } from '@rocket.chat/core-typings';

import type { IPolicyDecisionPoint } from './types';

export class ExternalPDP implements IPolicyDecisionPoint {
	async canAccessObject(
		_room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		_user: AtLeast<IUser, '_id'>,
		_userSub: ISubscription,
		_decisionCacheTimeout: number,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		throw new Error('ExternalPDP: canAccessObject not implemented');
	}

	async checkUsernamesMatchAttributes(_usernames: string[], _attributes: IAbacAttributeDefinition[], _object: IRoom): Promise<void> {
		throw new Error('ExternalPDP: checkUsernamesMatchAttributes not implemented');
	}

	async onRoomAttributesChanged(
		_room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		_newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]> {
		throw new Error('ExternalPDP: onRoomAttributesChanged not implemented');
	}

	async onSubjectAttributesChanged(_user: IUser, _next: IAbacAttributeDefinition[]): Promise<IRoom[]> {
		throw new Error('ExternalPDP: onSubjectAttributesChanged not implemented');
	}
}
