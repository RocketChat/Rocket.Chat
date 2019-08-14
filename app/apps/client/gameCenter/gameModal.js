import axios from 'axios';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import { modal } from '../../../ui-utils';
import { randomString } from '../utils';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

import './gameModal.html';

const SESSION_ID_LENGTH = 80;
let sessionId;

Template.GameModal.events({
	'click .rc-game.close'() {
		modal.cancel();
	},
});

Template.GameModal.onCreated(function() {
	const { data: { options } } = Template.instance();
	const { username, _id } = Meteor.user();
	const avatarUrl = `${ document.baseURI }${ getUserAvatarURL(username) }`;

	sessionId = randomString(SESSION_ID_LENGTH);

	if (options.webhooks) {
		const { sessionStarts = null } = options.webhooks;

		if (sessionStarts) {
			axios.post(sessionStarts, {
				event: 'sessionStarts',
				sessionId,
				player: {
					userId: _id,
					username,
					avatarUrl,
				},
			}, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
	}
});

Template.GameModal.onDestroyed(function() {
	const { data: { options } } = Template.instance();
	const { username, _id } = Meteor.user();
	const avatarUrl = `${ document.baseURI }${ getUserAvatarURL(username) }`;

	if (options.webhooks) {
		const { sessionEnds = null } = options.webhooks;

		if (sessionEnds) {
			axios.post(sessionEnds, {
				event: 'sessionEnds',
				sessionId,
				player: {
					userId: _id,
					username,
					avatarUrl,
				},
			}, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
	}
});
