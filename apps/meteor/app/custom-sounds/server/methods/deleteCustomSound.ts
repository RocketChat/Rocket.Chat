import type { ICustomSound } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { deleteCustomSound } from '../lib/deleteCustomSound';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteCustomSound(_id: ICustomSound['_id']): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteCustomSound(_id) {
		return deleteCustomSound(this.userId, _id);
	},
});
