import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addSamlService } from '../lib/settings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addSamlService(name: string): void;
	}
}

Meteor.methods<ServerMethods>({
	addSamlService(name) {
		methodDeprecationLogger.method('addSamlService', '9.0.0', []);
		addSamlService(name);
	},
});
