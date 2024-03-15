import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveDepartment': (
			_id: string | null,
			departmentData: {
				enabled: boolean;
				name: string;
				description?: string;
				showOnRegistration: boolean;
				email: string;
				showOnOfflineForm: boolean;
				requestTagBeforeClosingChat?: boolean;
				chatClosingTags?: string[];
				fallbackForwardDepartment?: string;
				departmentsAllowedToForward?: string[];
			},
			departmentAgents?:
				| {
						agentId: string;
						count?: number | undefined;
						order?: number | undefined;
				  }[]
				| undefined,
		) => ILivechatDepartment;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-departments'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartment',
			});
		}

		return Livechat.saveDepartment(_id, departmentData, { upsert: departmentAgents });
	},
});
