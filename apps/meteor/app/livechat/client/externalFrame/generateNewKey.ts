import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { generateKey } from './crypto';
import { sdk } from '../../../utils/client/lib/SDKClient';

Meteor.methods<ServerMethods>({
	async omnichannelExternalFrameGenerateKey() {
		const key = await generateKey();
		await sdk.call('saveSetting', 'Omnichannel_External_Frame_Encryption_JWK', key);
	},
});
