import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/Livechat';
import { Users } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveAgentInfo'(_id: string, agentData: Record<string, unknown>, agentDepartments: string[]): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveAgentInfo'(_id, agentData, agentDepartments) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveAgentInfo',
			});
		}

		const user = Users.findOneById(_id);
		if (!user || !(await hasRoleAsync(_id, 'livechat-agent'))) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', {
				method: 'livechat:saveAgentInfo',
			});
		}

		return Livechat.saveAgentInfo(_id, agentData, agentDepartments);
	},
});
