/* UserRoles RoomRoles*/
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { getAvatarUrlFromUsername } from 'meteor/rocketchat:utils';

/*
 * When a repostedMessage is eligible to be answered as a independent question then it can be threaded into a new channel.
 * When threading, the question is re-posted into a new room. To leave origin traces between the messages we update
 * the original repostedMessage with system repostedMessage to allow user to navigate to the repostedMessage created in the new Room and vice verse.
 */
export class ThreadBuilder {
	constructor(parentRoomId, openingQuestion) {
		this._openingQuestion = openingQuestion;
		if (!this._openingQuestion.u) {
			this._openingQuestion.u = Meteor.user();
		}
		this._parentRoomId = parentRoomId;
		this._parentRoom = ThreadBuilder.getRoom(this._parentRoomId);
		this.rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
	}

	static getNextId() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Thread_Count',
		};
		const update = {
			$inc: {
				value: 1,
			},
		};
		const findAndModifyResult = findAndModify(query, null, update);
		return findAndModifyResult.value.value;
	}

	static getRoom(roomId) {
		return RocketChat.models.Rooms.findOne(roomId);
	}

	_postMessage(room, user, repostedMessage, attachments, channels, mentions) {
		attachments = attachments || [];

		// sendMessage expects the attachments timestamp to be a string, => serialize it
		attachments.forEach((attachment) =>
			attachment.ts = attachment.ts ? attachment.ts.toISOString() : ''
		);
		const newMessage = { _id: Random.id(), rid: room.rid, msg: repostedMessage, attachments, channels, mentions };
		return RocketChat.sendMessage(user, newMessage, room);
	}

	_getMessageUrl(msgId) {
		const siteUrl = RocketChat.settings.get('Site_Url');
		return `${ siteUrl }${ siteUrl.endsWith('/') ? '' : '/' }?msg=${ msgId }`;
	}

	_linkMessages(roomCreated, parentRoom, repostedMessage) {
		if (this.rocketCatUser && Meteor.userId()) {
			/* Add link in parent Room */

			const linkMessage = Object.assign({}, this._openingQuestion); // shallow copy of the original message
			delete linkMessage._id;

			const repostingUser = Meteor.user();
			linkMessage.u = {
				_id: repostingUser._id,
				username: repostingUser.username,
				name: repostingUser.name,
			};

			linkMessage.mentions = [{
				_id: repostingUser._id, // Thread Initiator
				name: repostingUser.username, // Use @Name field for navigation
			}].concat(this._openingQuestion.mentions || []);

			linkMessage.channels = [{
				_id: roomCreated._id, // Parent Room ID
				name: roomCreated.name,
				initialMessage: {
					_id: repostedMessage._id,
					text: repostedMessage.msg,
				},
			}];

			const messageQuoteAttachment = { // @see pinMessage.js
				message_link: FlowRouter.path('message', { id: repostedMessage._id }),
				text: this._openingQuestion.msg,
				ts: this._openingQuestion.ts,
			};

			if (repostingUser._id !== this._openingQuestion.u._id) {
				messageQuoteAttachment.author_name = this._openingQuestion.u.username;
				messageQuoteAttachment.author_icon = getAvatarUrlFromUsername(this._openingQuestion.u.username);
			}

			linkMessage.attachments = [messageQuoteAttachment].concat(this._openingQuestion.attachments || []);

			linkMessage.urls = [{ url: this._getMessageUrl(repostedMessage._id) }];

			// we want to create a system message for linking the thread from the parent room - so the parent room
			// has to support system messages at least for this interaction
			if (!parentRoom.sysMes) {
				RocketChat.models.Rooms.setSystemMessagesById(parentRoom._id, true);
			}
			RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('create-thread', parentRoom._id, this._getMessageUrl(repostedMessage._id), this.rocketCatUser, linkMessage, { ts: this._openingQuestion.ts });

			// reset it if necessary
			if (!parentRoom.sysMes) {
				RocketChat.models.Rooms.setSystemMessagesById(parentRoom._id, false);
			}
			return true;
		}
	}

	_threadWelcomeMessage(threadRoom, parentRoom) {
		const user = Meteor.user();
		const welcomeMessage = {
			_id: Random.id(),
			rid: threadRoom._id,
			mentions: [{
				_id: user._id, // Thread Initiator
				name: user.username, // Use @Name field for navigation
			}],
			channels: [{
				_id: parentRoom._id,
				name: parentRoom.name,
			}],
		};
		return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('thread-welcome', threadRoom._id, '', this.rocketCatUser, welcomeMessage);
	}

	_getMembers() {
		const checkRoles = ['owner', 'moderator', 'leader'];
		const maxInvitationCount = Math.max(RocketChat.models.Settings.findOneById('Thread_invitations_threshold').value, 0) || 0;
		let members = [];
		const admins = RocketChat.models.Subscriptions.findByRoomIdAndRoles(this._parentRoomId, checkRoles).fetch().map((s) => ({
			username: s.u.username,
		}));
		const users = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(this._parentRoomId, {
			fields: {
				'u._id': 1,
				'u.username': 1,
			},
			sort: {
				open: -1,
				ls: -1,
			},
		}).fetch().map((s) => ({
			id: s.u._id,
			username: s.u.username,
		}));
		if (this._parentRoom.t === 'c') {
			// only add online users
			members = RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(users.slice(0, maxInvitationCount).map((user) => user.id)).fetch().map((user) => user.username);
			// add admins to the member list and avoid duplicates
			members = Array.from(new Set(members.concat(admins.map((user) => user.username))));
		} else {
			// in direct messages and groups, add all users as members of the thread
			members = users.map((user) => user.username);
		}
		return members;
	}

	create() {
		// Generate RoomName for the new room to be created.
		this.name = `${ this._parentRoom.name || this._parentRoom.usernames.join('-') }-${ ThreadBuilder.getNextId() }`;
		const threadRoomType = this._parentRoom.t === 'd' ? 'p' : this._parentRoom.t;
		const threadRoomCreationResult = RocketChat.createRoom(threadRoomType, this.name, Meteor.user() && Meteor.user().username, this._getMembers(), false,
			{
				announcement: this._openingQuestion.msg,
				topic: this._parentRoom.name ? this._parentRoom.name : '',
				parentRoomId: this._parentRoomId,
			});

		// Create messages in the newly created thread and it's parent which link the two rooms
		const threadRoom = RocketChat.models.Rooms.findOneById(threadRoomCreationResult.rid);
		if (threadRoom && this._parentRoom) {
			this._threadWelcomeMessage(threadRoom, this._parentRoom);

			// Post message
			const repostedMessage = this._postMessage(
				threadRoom,
				this._openingQuestion.u,
				this._openingQuestion.msg,
				this._openingQuestion.attachments ? this._openingQuestion.attachments.filter((attachment) => attachment.type && attachment.type === 'file') : []
			);

			// Create messages linking the parent room and the thread
			this._linkMessages(threadRoom, this._parentRoom, repostedMessage);
		}
		Meteor.call('saveRoomSettings', threadRoomCreationResult.rid, 'systemMessages', false);

		return threadRoom;
	}
}

// Expose the functionality to the client as method
Meteor.methods({
	createThread(parentRoomId, openingQuestion) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ThreadCreation' });
		}

		return new ThreadBuilder(parentRoomId, openingQuestion).create();
	},
	createThreadFromMessage(openingQuestion) {
		const thread = Meteor.call('createThread', openingQuestion.rid, openingQuestion);
		if (thread) {
			// remove the original repostedMessage from the display
			RocketChat.models.Messages.setHiddenById(openingQuestion._id);
			return thread;
		}
	},
});
