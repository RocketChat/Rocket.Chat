import type { ICustomSound } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { deleteCustomSound } from '../lib/deleteCustomSound';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteCustomSound(_id: ICustomSound['_id']): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteCustomSound(_id) {
		methodDeprecationLogger.method('deleteCustomSound', '9.0.0', '/v1/custom-sounds.delete');
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-sounds'))) {
			throw new Meteor.Error('not_authorized');
		}
		check(_id, String);
		await deleteCustomSound(_id);
		return true;
	},
});
