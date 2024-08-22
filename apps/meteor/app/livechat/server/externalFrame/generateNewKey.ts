import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
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
