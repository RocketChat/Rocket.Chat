import { Meteor } from 'meteor/meteor';
import mem from 'mem';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { LivechatUnit } from '@rocket.chat/models';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';

async function getUnitsFromUserRoles(user: string | null): Promise<string[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	if (!(await hasAnyRoleAsync(user, ['livechat-monitor']))) {
		return;
	}

	return LivechatUnit.findByMonitorId(user);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 5000 });

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getUnitsFromUser'(): Promise<string[] | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:getUnitsFromUser'(): Promise<string[] | undefined> {
		const user = Meteor.userId();
		return memoizedGetUnitFromUserRoles(user);
	},
});
