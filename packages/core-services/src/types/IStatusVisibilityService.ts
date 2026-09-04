import type { IUser, UserPresence } from '@rocket.chat/core-typings';

export type PresenceScope = { hideAll: true } | { hideAll: false; hidden?: ReadonlySet<IUser['_id']> };

export interface IStatusVisibilityService {
	getPresenceScope(viewerId: IUser['_id'] | null | undefined): Promise<PresenceScope>;
	isPresenceDisabledFor(targetId: IUser['_id']): Promise<boolean>;
	hasRestrictions(targetId: IUser['_id']): Promise<boolean>;
	getRestrictedUsers(): Promise<IUser['_id'][]>;
	refresh(targets?: IUser['_id'][]): Promise<UserPresence[]>;
	invalidate(targets?: IUser['_id'][], options?: { allViewers?: boolean }): Promise<UserPresence[]>;
}
