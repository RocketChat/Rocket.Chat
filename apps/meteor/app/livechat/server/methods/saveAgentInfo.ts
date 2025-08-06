import type { ServerMethods } from '@rocket.chat/ddp-client';

import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { saveAgentInfo } from '../lib/omni-users';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveAgentInfo'(_id: string, agentData: Record<string, unknown>, agentDepartments: string[]): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveAgentInfo'(_id, agentData, agentDepartments) {
		check(_id, String);
		check(agentData, Object);
		check(agentDepartments, [String]);

		const user = await Meteor.userAsync();
		if (!user || !(await hasPermissionAsync(user._id, 'manage-livechat-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveAgentInfo',
			});
		}

		if (!(await hasRoleAsync(_id, 'livechat-agent'))) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', {
				method: 'livechat:saveAgentInfo',
			});
		}

		return saveAgentInfo(_id, agentData, agentDepartments);
	},
});
