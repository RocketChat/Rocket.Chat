import { Meteor } from 'meteor/meteor';

Meteor.methods({
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	omnichannelExternalFrameGenerateKey() {
		return {
			message: 'Generating_key',
		};
	}, // only to prevent error when calling the client method
});
