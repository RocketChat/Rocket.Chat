import type { ICustomSound } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listCustomSounds(): ICustomSound[];
	}
}

Meteor.methods<ServerMethods>({
	async listCustomSounds() {
		methodDeprecationLogger.method('listCustomSounds', '9.0.0', '/v1/custom-sounds.list');
		return CustomSounds.find({}).toArray();
	},
});
