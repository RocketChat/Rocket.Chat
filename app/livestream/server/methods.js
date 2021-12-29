import { Meteor } from 'meteor/meteor';

import { createLiveStream, statusLiveStream, statusStreamLiveStream, getBroadcastStatus, setBroadcastStatus } from './functions/livestream';
import { settings } from '../../settings';
import { Rooms } from '../../models';

const selectLivestreamSettings = (user) => user && user.settings && user.settings.livestream;

Meteor.methods({
	async livestreamStreamStatus({ streamId }) {
		if (!streamId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'Livestream ID not found', {
				method: 'livestreamStreamStatus',
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
				method: 'livestreamStreamStatus',
			});
		}

		const { access_token, refresh_token } = livestreamSettings;

		return statusStreamLiveStream({
			id: streamId,
			access_token,
			refresh_token,
			clientId: settings.get('Broadcasting_client_id'),
			clientSecret: settings.get('Broadcasting_client_secret'),
		});
	},
	async setLivestreamStatus({ broadcastId, status }) {
		if (!broadcastId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart',
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart',
			});
		}

		const { access_token, refresh_token } = livestreamSettings;

		return statusLiveStream({
			id: broadcastId,
			access_token,
			refresh_token,
			status,
			clientId: settings.get('Broadcasting_client_id'),
			clientSecret: settings.get('Broadcasting_client_secret'),
		});
	},
	async livestreamGet({ rid }) {
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGet',
			});
		}

		const room = Rooms.findOne({ _id: rid });

		if (!room) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGet',
			});
		}

		const { access_token, refresh_token } = livestreamSettings;
		return createLiveStream({
			room,
			access_token,
			refresh_token,
			clientId: settings.get('Broadcasting_client_id'),
			clientSecret: settings.get('Broadcasting_client_secret'),
		});
	},
	async getBroadcastStatus({ broadcastId }) {
		if (!broadcastId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'Broadcast ID not found', {
				method: 'getBroadcastStatus',
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
				method: 'getBroadcastStatus',
			});
		}

		const { access_token, refresh_token } = livestreamSettings;

		return getBroadcastStatus({
			id: broadcastId,
			access_token,
			refresh_token,
			clientId: settings.get('Broadcasting_client_id'),
			clientSecret: settings.get('Broadcasting_client_secret'),
		});
	},
	async setBroadcastStatus({ broadcastId, status }) {
		if (!broadcastId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'Broadcast ID not found', {
				method: 'setBroadcastStatus',
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
				method: 'setBroadcastStatus',
			});
		}

		const { access_token, refresh_token } = livestreamSettings;

		return setBroadcastStatus({
			id: broadcastId,
			access_token,
			refresh_token,
			status,
			clientId: settings.get('Broadcasting_client_id'),
			clientSecret: settings.get('Broadcasting_client_secret'),
		});
	},
});
