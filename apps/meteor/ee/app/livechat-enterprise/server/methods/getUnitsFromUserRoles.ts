import { Meteor } from 'meteor/meteor';
import mem from 'mem';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import LivechatUnit from '../../../models/server/models/LivechatUnit';

async function getUnitsFromUserRoles(user: string | null): Promise<{ [k: string]: any }[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	return (await hasAnyRoleAsync(user, ['livechat-monitor'])) && LivechatUnit.findByMonitorId(user);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 5000 });

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getUnitsFromUser'(): Promise<{ [k: string]: any }[] | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:getUnitsFromUser'(): Promise<{ [k: string]: any }[] | undefined> {
		const user = Meteor.userId();
		return memoizedGetUnitFromUserRoles(user);
	},
});
