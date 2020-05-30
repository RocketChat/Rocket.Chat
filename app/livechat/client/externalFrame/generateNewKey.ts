import { Meteor } from 'meteor/meteor';

import { generateKey } from './crypto';

Meteor.methods({
	async omnichannelExternalFrameGenerateKey() {
		const key = await generateKey();
		Meteor.call('saveSetting', 'Omnichannel_External_Frame_Encryption_JWK', key);
	},
});
