import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveDepartmentAgents'(
			_id: string,
			departmentAgents: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order' | 'username'>[],
		): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveDepartmentAgents'(_id, departmentAgents) {
		methodDeprecationLogger.method('livechat:saveDepartmentAgents', '7.0.0');

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'add-livechat-department-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return Livechat.saveDepartmentAgents(_id, { upsert: departmentAgents });
	},
});
