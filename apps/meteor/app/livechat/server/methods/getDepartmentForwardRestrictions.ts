import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getDepartmentForwardRestrictions'(departmentId: string): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getDepartmentForwardRestrictions'(departmentId) {
		methodDeprecationLogger.method('livechat:getDepartmentForwardRestrictions', '7.0.0');
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:getDepartmentForwardRestrictions',
			});
		}

		const options = await callbacks.run('livechat.onLoadForwardDepartmentRestrictions', { departmentId });
		const { restrictions } = options;

		return restrictions;
	},
});
