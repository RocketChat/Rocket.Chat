import {Meteor} from 'meteor/meteor';
import { createLiveStream, statusLiveStream, statusStreamLiveStream } from './functions/livestream';

const selectLivestreamSettings = (user) => user && user.settings && user.settings.livestream;

Meteor.methods({

	async livestreamStreamStatus({streamId}) {
		if (!streamId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'Livestream ID not found', {
				method: 'livestreamStreamStatus'
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
				method: 'livestreamStreamStatus'
			});
		}

		const {access_token, refresh_token} = livestreamSettings;

		return await statusStreamLiveStream({
			id: streamId,
			access_token,
			refresh_token,
			clientId: RocketChat.settings.get('Broadcasting_client_id'),
			clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
		});

	},
	async livestreamStart({broadcastId}) {
		if (!broadcastId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart'
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart'
			});
		}

		const {access_token, refresh_token} = livestreamSettings;

		return await statusLiveStream({
			id: broadcastId,
			access_token,
			refresh_token,
			status: 'live',
			clientId: RocketChat.settings.get('Broadcasting_client_id'),
			clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
		});

	},
	async livestreamTest({broadcastId}) {
		if (!broadcastId) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart'
			});
		}
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamStart'
			});
		}

		const {access_token, refresh_token} = livestreamSettings;

		return await statusLiveStream({
			id: broadcastId,
			access_token,
			refresh_token,
			status:'testing',
			clientId: RocketChat.settings.get('Broadcasting_client_id'),
			clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
		});

	},
	async livestreamGet({rid}) {
		const livestreamSettings = selectLivestreamSettings(Meteor.user());

		if (!livestreamSettings) {
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGet'
			});
		}

		const room = RocketChat.models.Rooms.findOne({_id: rid});

		if (!room) {
			// TODO: change error
			throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGet'
			});
		}

		const {access_token, refresh_token} = livestreamSettings;

		return await createLiveStream({
			room,
			access_token,
			refresh_token,
			clientId: RocketChat.settings.get('Broadcasting_client_id'),
			clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
		});

	}
});
