import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

import { statusVisibilityGate } from './StatusVisibilityGate';
import type { PresenceScope } from './presenceScope';
import { NOTHING_HIDDEN, isHiddenFor, scopeHidesAnyone } from './presenceScope';
import { redactStatus } from './redactStatus';
import { settings } from '../../settings';

export const getPresenceScope = async (viewerId: IUser['_id'] | null | undefined): Promise<PresenceScope> => {
	if (
		settings.get<boolean>('Accounts_UserStatus_Enabled') &&
		!settings.get<boolean>('Accounts_StatusVisibility_Enabled') &&
		!statusVisibilityGate.isActive()
	) {
		return NOTHING_HIDDEN;
	}

	return StatusVisibility.getPresenceScope(viewerId);
};

export const filterHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], scope: PresenceScope): T[] =>
	scope.hideAll ? [] : users.filter((user) => !isHiddenFor(scope, user._id));

export const redactHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], scope: PresenceScope): T[] =>
	scopeHidesAnyone(scope) ? users.map((user) => (isHiddenFor(scope, user._id) ? redactStatus(user) : user)) : users;
