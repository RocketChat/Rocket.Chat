import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { sdk } from '../../../utils/client/lib/SDKClient';
import { generateKey } from './crypto';

Meteor.methods<ServerMethods>({
	async omnichannelExternalFrameGenerateKey() {
		const key = await generateKey();
		await sdk.call('saveSetting', 'Omnichannel_External_Frame_Encryption_JWK', key);
	},
});
