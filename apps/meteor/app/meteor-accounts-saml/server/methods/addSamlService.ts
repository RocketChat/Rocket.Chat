import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { addSamlService } from '../lib/settings';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addSamlService(name: string): void;
	}
}

Meteor.methods<ServerMethods>({
	addSamlService(name) {
		addSamlService(name);
	},
});
