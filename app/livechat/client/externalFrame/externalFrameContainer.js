import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { APIClient } from '../../../utils/client';
import { settings } from '../../../settings/client';

import './externalFrameContainer.html';

Template.ExternalFrameContainer.helpers({
	externalFrameUrl() {
		const frameURLSetting = settings.get('Omnichannel_External_Frame_URL');
		const { 'X-Auth-Token': authToken } = APIClient.getCredentials();

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
