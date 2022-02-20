import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

import { APIClient } from '../../../utils/client';
import { settings } from '../../../settings/client';
import { encrypt, getKeyFromString } from './crypto';

import './externalFrameContainer.html';

Template.ExternalFrameContainer.helpers({
	externalFrameUrl() {
		const authToken = Template.instance().authToken.get();

		if (!authToken) {
			return '';
		}

		const frameURLSetting = settings.get('Omnichannel_External_Frame_URL');

		try {
			const frameURL = new URL(frameURLSetting);

			frameURL.searchParams.append('uid', Meteor.userId());
			frameURL.searchParams.append('rid', Session.get('openedRoom'));
			frameURL.searchParams.append('t', authToken);

			return frameURL.toString();
		} catch {
			console.error('Invalid URL provided to external frame');

			return '';
		}
	},
});

Template.ExternalFrameContainer.onCreated(async function () {
	this.authToken = new ReactiveVar();

	const { 'X-Auth-Token': authToken } = APIClient.getCredentials();
	const keyStr = settings.get('Omnichannel_External_Frame_Encryption_JWK');

	if (keyStr) {
		return this.authToken.set(await encrypt(authToken, await getKeyFromString(keyStr)));
	}

	this.authToken.set(authToken);
});
