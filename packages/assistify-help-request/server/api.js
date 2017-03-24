// import { HelpDiscussionCreatedResponse } from './types';
import {helpRequest} from '../help-request';

class HelpRequestApi {

	/**
	 *
	 * @param bodyParams
	 * @throws Meteor.Error on invalid request
	 */
	static validateHelpDiscussionPostRequest(bodyParams) {
		// transport the user's information in the header, just like it's done in the RC rest-api

		if (!bodyParams) {
			throw new Meteor.Error('Post body empty');
		}

		if (!bodyParams.support_area || bodyParams.support_area.trim() === '') {
			throw new Meteor.Error('No support area defined');
		}

		if (!bodyParams.seeker) {
			throw new Meteor.Error('No user provided who is seeking help');
		}

		if (!bodyParams.providers || bodyParams.providers.length === 0) {
			throw new Meteor.Error('At least one user who could potentially help needs to be supplied');
		}
	}

	processHelpDiscussionPostRequest(bodyParams) {
		let environment = bodyParams.environment || {};
		let callbackUrl = bodyParams.callbackUrl || "";

		const creationResult = this._createHelpDiscussion(bodyParams.support_area, bodyParams.seeker, bodyParams.providers, bodyParams.message, environment, callbackUrl);

		//todo: record the helpdesk metadata

		return new helpRequest.HelpDiscussionCreatedResponse(
			HelpRequestApi.getUrlForRoom(creationResult.room),
			creationResult.providers
		)
	}

	static getUrlForRoom(room) {
		const siteUrl = RocketChat.settings.get('Site_Url');

		return siteUrl + 'channel/' + room.name;
	}

	_findUsers(userDescriptions) {
		const REGEX_OBJECTID = /^[a-f\d]{24}$/i;
		let potentialIds = [];
		let potentialEmails = [];

		let users = [];

		userDescriptions.forEach((userDescription) => {
			if (userDescription.id && userDescription.id.match(REGEX_OBJECTID)) {
				potentialIds.push(userDescription.id);
			}

			if (userDescription.email && userDescription.email.search('@') !== -1) {
				potentialEmails.push(userDescription.email);
			}
		});

		if (potentialEmails.length > 0) {
			potentialEmails.forEach((emailAddress) => {
				users.push(RocketChat.models.Users.findOneByEmailAddress(emailAddress));
			});
			// users = users.concat(
			// 	RocketChat.models.Users.findByEmailAddresses(potentialEmails).fetch()
			// );
		}

		if (potentialIds.length > 0) {
			potentialIds.forEach((_id) => {
				users.push(RocketChat.models.Users.findById(_id).fetch());
			});
		}

		return users;

	}

	static getNextAssistifyRoomCode() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Assistify_Room_Count'
		};

		const update = {
			$inc: {
				value: 1
			}
		};

		const findAndModifyResult = findAndModify(query, null, update);

		return findAndModifyResult.value.value;
	}

	/**
	 * Creates a new room and adds users who potential might be able to help
	 * @param seeker: The user looking for help. EMail-address and ID accepted
	 * @param providers: An array of Users who should join the conversation in order to resolve the question. EMail-addresses and IDs accepted
	 * @param message: The message describing the problematic situation
	 * @param environment: Context information about the current system-context of the seeker
	 * @param callback_url: An optional URL which shall be called on reply of a provider
	 * @private
	 */
	_createHelpDiscussion(support_area, seeker, providers, message, environment = {}, callback_url = "") {
		const seekerUser = this._findUsers([seeker])[0];
		const providerUsers = this._findUsers(providers);
		if (!seekerUser) {
			throw new Meteor.Error("Invalid user " + JSON.stringify(seeker) + ' provided');
		}

		let channel = {};
		let helpRequestId = "";
		try {
			Meteor.runAsUser(seekerUser._id, () => {
				channel = Meteor.call('createRequest', 'Assistify_' + HelpRequestApi.getNextAssistifyRoomCode(), "", providerUsers.map((user) => user.username));
				try {
					if (message) {
						RocketChat.sendMessage({
							username: seekerUser.username,
							_id: seekerUser._id
						}, {msg: message}, {_id: channel.rid});
					}

				} catch (err) {
					console.error('Could not add help message', err);
					throw new Meteor.Error(err);
				}
			});
		} catch (err) {
			//todo: Duplicate channel (same question): Join the seeker
			throw new Meteor.Error(err);
		}

		return {
			room: RocketChat.models.Rooms.findOne({_id: channel.rid}),
			providers
		};
	}
}

helpRequest.HelpRequestApi = HelpRequestApi;
