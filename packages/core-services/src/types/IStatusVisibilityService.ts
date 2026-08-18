import type { IUser, UserPresence } from '@rocket.chat/core-typings';

export interface IStatusVisibilityService {
	getHiddenFrom(viewerId: IUser['_id'] | null | undefined): Promise<IUser['_id'][]>;
	hasRestrictions(targetId: IUser['_id']): Promise<boolean>;
	// Rebuilds and returns whoever may have changed visibility, including those who stopped hiding, so
	// the caller can re-emit their presence. Called by each node reacting to `presence.invalidateVisibility`.
	refresh(targets?: IUser['_id'][]): Promise<UserPresence[]>;

	// Same, plus broadcasting `presence.invalidateVisibility`. Use it when something changed; never from
	// a handler of that event, which would make the nodes re-broadcast to each other.
	invalidate(targets?: IUser['_id'][]): Promise<UserPresence[]>;
}
