import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		omnichannelExternalFrameGenerateKey(): unknown;
	}
}

Meteor.methods<ServerMethods>({
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	omnichannelExternalFrameGenerateKey() {
		return {
			message: 'Generating_key',
		};
	}, // only to prevent error when calling the client method
});
