import axios from 'axios';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import { modal } from '../../../ui-utils';
import { randomString } from '../utils';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

import './gameContainer.html';

const SESSION_ID_LENGTH = 80;
let sessionId;

Template.GameContainer.currentExternalComponent = new ReactiveVar();

Template.GameContainer.helpers({
	isContextualBar() {
		const { data: { game } } = Template.instance();
		const { location } = game;

		return location === 'CONTEXTUAL_BAR';
	},
	isModal() {
		const { data: { game } } = Template.instance();
		const { location } = game;

		return location === 'MODAL';
	},
});

Template.GameContainer.events({
	'click .rc-game.close'() {
		modal.cancel();
	},
	'click .js-back'() {
		const { data: { clearGameManifestInfo } } = Template.instance();

		clearGameManifestInfo();
	},
});

Template.GameContainer.onCreated(function() {
	const { data: { game } } = Template.instance();
	const { options } = game;
	const { username, _id } = Meteor.user();
	const avatarUrl = `${ document.baseURI }${ getUserAvatarURL(username) }`;

	Template.GameContainer.currentExternalComponent = game;
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

Template.GameContainer.onDestroyed(function() {
	const { data: { game } } = Template.instance();
	const { options } = game;
	const { username, _id } = Meteor.user();
	const avatarUrl = `${ document.baseURI }${ getUserAvatarURL(username) }`;

	Template.GameContainer.currentExternalComponent = null;

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
