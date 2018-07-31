/* UserRoles RoomRoles*/
import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';

/*
 * When a message is eligible to be answered as a independent question then it can be threaded into a new channel.
 * When threading, the question is re-posted into a new room. To leave origin traces between the messages we update
 * the original message with system message to allow user to navigate to the message created in the new Room and vice verse.
 */
export class ThreadBuilder {
	constructor(parentRoomId, openingQuestion) {
		this._openingQuestion = openingQuestion;
		if (!this._openingQuestion.u) {
			this._openingQuestion.u = Meteor.user();
		}
		this._parentRoomId = parentRoomId;
	}

	static getNextId() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Thread_Count'
		};
		const update = {
			$inc: {
				value: 1
			}
		};
		const findAndModifyResult = findAndModify(query, null, update);
		return findAndModifyResult.value.value;
	}

	static getRoom(roomId) {
		return RocketChat.models.Rooms.findOne(roomId);
	}

	_postMessage(room, user, message, attachments, channels, mentions) {
		attachments = attachments || [];

		//sendMessage expects the attachments timestamp to be a string, => serialize it
		attachments.forEach(attachment =>
			attachment.ts = attachment.ts ? attachment.ts.toISOString() : ''
		);
		const newMessage = {_id: Random.id(), rid: room.rid, msg: message, attachments, channels, mentions};
		return RocketChat.sendMessage(user, newMessage, room);
	}

	_getMessageUrl(msgId) {
		return FlowRouter.path('message', {id: msgId});
	}

	_linkMessages(roomCreated, parentRoom, message) {
		const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
		if (rocketCatUser && Meteor.userId()) {
			//TODO: Add link in parent Room

			/* Parent Room
			 */
			RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('create-thread', parentRoom._id, this._getMessageUrl(message._id), rocketCatUser,
				{
					mentions: [{
						_id: Meteor.user()._id, // Thread Initiator
						name: Meteor.user().username // Use @Name field for navigation
					}],
					channels: [{
						_id: roomCreated._id, // Parent Room ID
						name: roomCreated.name
					}]
				});

			// RocketChat.models.Messages.updateMsgWithThreadMessage(
			// 	Meteor.user().username === this._openingQuestion.u.username ? 'thread-started-message-self' : 'thread-started-message',
			// 	this._openingQuestion._id,
			// 	'',
			// 	Meteor.user(),
			// 	{
			// 		mentions: [
			// 			{
			// 				_id: Meteor.user()._id, // Thread Initiator
			// 				name: Meteor.user().username
			// 			}]
			// 	}
			// );

			// The following lines would have the attachment remain at the original message.
			// if (this._openingQuestion.attachments) {
			// 	RocketChat.models.Messages.addMessageAttachments(this._openingQuestion._id, this._openingQuestion.attachments);
			// }

			/*
			 * Child Room
			 */
			// RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('thread-welcome-message', roomCreated._id, this._getMessageUrl(this._openingQuestion._id), rocketCatUser,
			// 	{
			// 		mentions: [{
			// 			_id: Meteor.user()._id, // Thread Initiator
			// 			name: Meteor.user().username // Use @Name field for navigation
			// 		}],
			// 		channels: [{
			// 			_id: parentRoom._id // Parent Room ID
			// 		}]
			// 	});
			// Re-post message in the new room

			//Post message

			/*			const msgAuthor = RocketChat.models.Users.findOneByUsername(this._openingQuestion.u.username);
						const msgRePosted = this._postMessage(
							roomCreated,
							msgAuthor,
							this._openingQuestion.msg,
							this._openingQuestion.attachments ? this._openingQuestion.attachments.filter(attachment => attachment.type && attachment.type === 'file') : []
						);

						if (msgRePosted) {
							if (!this._openingQuestion._id) {
								// TODO: If the thread was created without selecting a message in the parent, we need to create a message first
								return;
							}
							/!* Add a reference to the original message which can be rendered for navigation *!/
							RocketChat.models.Messages.setMessageAttachments(this._openingQuestion._id, [{
								author_name: this._openingQuestion.u.username || this._openingQuestion.u.name,
								author_icon: `/avatar/${ this._openingQuestion.u.username }?_dc=0`,
								ts: this._openingQuestion.ts,
								fields: [{
									type: 'threadReference',
									value: this._openingQuestion.msg,
									threadUrl: this._getMessageUrl(msgRePosted._id)
								}]
							}]);
						}*/
		}
	}

	_getMembers() {
		const checkRoles = ['owner', 'moderator'];
		const members = [];
		const users = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(this._parentRoomId, {
			fields: {
				'u._id': 1,
				'u.username': 1
			}
		}).fetch().map(s => {
			return {
				id: s.u._id,
				username: s.u.username
			};
		});
		// TODO: filter on owner, moderators and those online (see @here-implementation)
		for (const user of users) {
			if (!RocketChat.authz.hasRole(user.id, checkRoles)) {
				RocketChat.models.Users.findOne({
					_id: user.id,
					status: {
						$in: ['online', 'away', 'busy']
					}
				});
				if (!user) {
					continue;
					// user.splice(users.indexOf(user), 1); //remove offline user
				}
			}
			members.push(user.username);
		}
		return members;
	}

	create() {
		const parentRoom = ThreadBuilder.getRoom(this._parentRoomId);
		// Generate RoomName for xthe new room to be created.
		this.name = `${ parentRoom.name }-${ ThreadBuilder.getNextId() }`;
		const roomCreateResult = RocketChat.createRoom(parentRoom.t, this.name, Meteor.user() && Meteor.user().username, this._getMembers(), false, {parentRoomId: this._parentRoomId});

		if (parentRoom.name) {
			RocketChat.saveRoomTopic(roomCreateResult.rid, parentRoom.name, Meteor.user());
		}

		// Create messages in the newly created thread and it's parent which link the two rooms
		const room = RocketChat.models.Rooms.findOneById(roomCreateResult.rid);
		if (room && parentRoom) {
			// Post message
			const message = this._postMessage(
				room,
				this._openingQuestion.u,
				this._openingQuestion.msg,
				this._openingQuestion.attachments ? this._openingQuestion.attachments.filter(attachment => attachment.type && attachment.type === 'file') : []
			);
			// TODO: post links
			this._linkMessages(room, parentRoom, message);
		}

		return roomCreateResult;
	}
}

// Expose the functionality to the client as method
Meteor.methods({
	createThread(parentRoomId, openingQuestion) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'ThreadCreation'});
		}

		return new ThreadBuilder(parentRoomId, openingQuestion).create();
	}
});
