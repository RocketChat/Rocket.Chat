import type { IUser, UserPresence } from '@rocket.chat/core-typings';

export interface IStatusVisibilityService {
	getHiddenFrom(viewerId: IUser['_id'] | null | undefined): Promise<IUser['_id'][]>;
	hasRestrictions(targetId: IUser['_id']): Promise<boolean>;
	getRestrictedUsers(): Promise<IUser['_id'][]>;
	refresh(targets?: IUser['_id'][]): Promise<UserPresence[]>;
	invalidate(targets?: IUser['_id'][]): Promise<UserPresence[]>;
}
