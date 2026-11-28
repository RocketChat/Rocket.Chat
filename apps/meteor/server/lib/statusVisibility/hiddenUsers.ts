import type { PresenceScope } from '@rocket.chat/core-services';
import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { statusVisibilityGate, NOTHING_HIDDEN, isHiddenFor, scopeHidesAnyone } from '@rocket.chat/streamer';

import { redactStatus } from './redactStatus';
import { isAdminHidingAllowed } from './settings';
import { settings } from '../../settings';

export const getUsersHiddenFrom = async (viewerId: IUser['_id'] | null | undefined): Promise<PresenceScope> => {
	if (settings.get<boolean>('Accounts_UserStatus_Enabled') && (!isAdminHidingAllowed() || !statusVisibilityGate.isActive())) {
		return NOTHING_HIDDEN;
	}

	return StatusVisibility.getHiddenFrom(viewerId);
};

export const filterHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], hidden: PresenceScope): T[] =>
	users.filter((user) => !isHiddenFor(hidden, user._id));

export const redactHiddenUser = <T extends Pick<IUser, '_id'>>(user: T, hidden: PresenceScope): T =>
	isHiddenFor(hidden, user._id) ? redactStatus(user) : user;

export const redactHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], hidden: PresenceScope): T[] =>
	scopeHidesAnyone(hidden) ? users.map((user) => redactHiddenUser(user, hidden)) : users;

export const redactHiddenMembers = <T extends { user: Pick<IUser, '_id'> }>(members: T[], hidden: PresenceScope): T[] =>
	scopeHidesAnyone(hidden) ? members.map((member) => ({ ...member, user: redactHiddenUser(member.user, hidden) })) : members;
