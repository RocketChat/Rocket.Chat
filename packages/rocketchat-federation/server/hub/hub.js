import { HTTP } from 'meteor/http';

import { upsertLocalUsers } from '../utils';

class HUB {
	constructor(config) {
		// General
		this.config = config;

		// Setup baseUrl
		const {
			hub: { host, port },
		} = this.config;

		this.baseUrl = `http://${ host }:${ port }`;

		// Setup handlers
		this.setupLocalHandlers();
	}

	register() {
		const {
			peer: { name: identifier, host, port },
		} = this.config;

		const users = Meteor.users
			.find(
				{ username: { $ne: 'rocket.cat' }, peer: { $exists: false } },
				{ fields: { services: 0 } },
			)
			.fetch();

		const {
			data: { peer, users: peerUsers },
		} = HTTP.call('POST', `${ this.baseUrl }/peers/register`, {
			data: { identifier, host, port, users },
		});

		// Save peer
		this.peer = peer;

		upsertLocalUsers(peerUsers);
	}

	setupLocalHandlers() {
		const self = this;

		// RocketChat.callbacks.add(
		// 	'afterCreateChannel',
		// 	function(user, room) {
		// 		console.log(user, room);
		// 	},
		// 	RocketChat.callbacks.priority.LOW,
		// 	'irc-on-create-channel'
		// );

		// RocketChat.callbacks.add(
		// 	'afterCreateRoom',
		// 	function(user, room) {
		// 		console.log(user, room);
		// 	},
		// 	RocketChat.callbacks.priority.LOW,
		// 	'irc-on-create-room'
		// );

		function sendUserUpdate(user) {
			const { baseUrl, peer } = self;

			HTTP.call(
				'PUT',
				`${ baseUrl }/users`,
				{
					data: {
						user,
						peer,
					},
				},
				(error) => {
					if (error) {
						console.log(`Error sending user to peer:${ peer.identifier }`);
						return;
					}

					console.log(`Sent user to peer:${ peer.identifier }`);
				}
			);
		}

		Accounts.onLogin(function(info) {
			const { user } = info;

			user.status = 'online';
			user.statusConnection = 'online';

			sendUserUpdate(user);
		});

		Accounts.onLogout(function(info) {
			const { user } = info;

			user.status = 'offline';
			user.statusConnection = 'offline';

			sendUserUpdate(user);
		});

		RocketChat.callbacks.add(
			'afterSaveMessage',
			function(message, room) {
				if (message.peer) {
					return; // Ignore messages that were already sent by a peer
				}

				const {
					usernames: [from, to],
				} = room;

				const userTo = RocketChat.models.Users.findOne({ username: to });

				if (!userTo || !userTo.peer) {
					return;
				}

				const userFrom = RocketChat.models.Users.findOne({ username: from });

				const { peer } = userTo;
				const { baseUrl, peer: fromPeer } = self;

				// Set the peer on the database
				RocketChat.models.Messages.update(
					{
						_id: message._id,
					},
					{
						$set: {
							peer: fromPeer,
						},
					},
				);

				// Set locally, so we can send it (without fetching the message from the DB)
				message.peer = fromPeer;

				HTTP.call(
					'POST',
					`${ baseUrl }/messages`,
					{
						data: {
							message,
							from: { peer_id: fromPeer._id, user_id: userFrom._id },
							to: { peer_id: peer._id, user_id: userTo._id },
						},
					},
					(error) => {
						if (error) {
							console.log(`Error sending message to peer:${ peer.identifier }`);
							return;
						}

						console.log(`Sent message to peer:${ peer.identifier }`);
					}
				);
			},
			RocketChat.callbacks.priority.LOW,
			'federation-on-save-message'
		);
	}
}

export default HUB;
