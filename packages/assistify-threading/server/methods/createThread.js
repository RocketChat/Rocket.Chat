/* UserRoles RoomRoles*/
// import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
// import { getAvatarUrlFromUsername } from 'meteor/rocketchat:utils';
import { hasAtLeastOnePermission, canAccessRoom } from 'meteor/rocketchat:authorization';
import { Messages, Rooms } from 'meteor/rocketchat:models';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from 'meteor/rocketchat:lib';
/*
* When a repostedMessage is eligible to be replyed as a independent question then it can be threaded into a new channel.
* When threading, the question is re-posted into a new room. To leave origin traces between the messages we update
* the original repostedMessage with system repostedMessage to allow user to navigate to the repostedMessage created in the new Room and vice verse.
*/
// export class ThreadBuilder {
// 	constructor(parentRoomId, openingMessage) {
// 		// this._openingMessage = openingMessage;
// 		// if (!this._openingMessage.u) {
// 		// 	this._openingMessage.u = Meteor.user();
// 		// }
// 		// this._parentRoomId = parentRoomId;
// 		// this._parentRoom = ThreadBuilder.getRoom(this._parentRoomId);
// 		// this.rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
// 	}

// 	static getNextId() {
// 		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
// 		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

// 		const query = {
// 			_id: 'Thread_Count',
// 		};
// 		const update = {
// 			$inc: {
// 				value: 1,
// 			},
// 		};
// 		const findAndModifyResult = findAndModify(query, null, update);
// 		return findAndModifyResult.value.value;
// 	}

// 	static getRoom(roomId) {
// 		return RocketChat.models.Rooms.findOne(roomId);
// 	}

// 	_postMessage(room, user, repostedMessage, attachments, channels, mentions) {
// 		attachments = attachments || [];

// 		// sendMessage expects the attachments timestamp to be a string, => serialize it
// 		attachments.forEach((attachment) =>
// 			attachment.ts = attachment.ts ? attachment.ts.toISOString() : ''
// 		);
// 		const newMessage = { _id: Random.id(), rid: room.rid, msg: repostedMessage, attachments, channels, mentions };
// 		return RocketChat.sendMessage(user, newMessage, room);
// 	}

// 	_getMessageUrl(msgId) {
// 		const siteUrl = RocketChat.settings.get('Site_Url');
// 		return `${ siteUrl }${ siteUrl.endsWith('/') ? '' : '/' }?msg=${ msgId }`;
// 	}

// 	_linkMessages(roomCreated, parentRoom, repostedMessage, p_message) {
// 		// if (!this.rocketCatUser || !Meteor.userId()) {
// 		// 	return false;
// 		// }
// 		// /* Add link in parent Room */

// 		// const linkMessage = Object.assign({}, this._openingMessage); // shallow copy of the original message
// 		// delete linkMessage._id;

// 		// const repostingUser = Meteor.user();
// 		// linkMessage.u = {
// 		// 	_id: repostingUser._id,
// 		// 	username: repostingUser.username,
// 		// 	name: repostingUser.name,
// 		// };

// 		// linkMessage.mentions = [{
// 		// 	_id: repostingUser._id, // Thread Initiator
// 		// 	name: repostingUser.username, // Use @Name field for navigation
// 		// }].concat(this._openingMessage.mentions || []);

// 		// linkMessage.channels = [{
// 		// 	_id: roomCreated._id, // Parent Room ID
// 		// 	name: roomCreated.name,
// 		// 	initialMessage: {
// 		// 		_id: repostedMessage._id,
// 		// 		text: repostedMessage.msg,
// 		// 	},
// 		// }];

// 		// const messageQuoteAttachment = { // @see pinMessage.js
// 		// 	message_link: FlowRouter.path('message', { id: repostedMessage._id }),
// 		// 	text: this._openingMessage.msg,
// 		// 	ts: this._openingMessage.ts,
// 		// 	fields: [
// 		// 		{
// 		// 			type: 'messageCounter',
// 		// 			count: 1,
// 		// 		},
// 		// 		{
// 		// 			type: 'lastMessageAge',
// 		// 			lm: this._openingMessage.ts,
// 		// 		}],
// 		// };

// 		// if (repostingUser._id !== this._openingMessage.u._id) {
// 		// 	messageQuoteAttachment.author_name = this._openingMessage.u.username;
// 		// 	messageQuoteAttachment.author_icon = getAvatarUrlFromUsername(this._openingMessage.u.username);
// 		// }

// 		// linkMessage.attachments = [messageQuoteAttachment].concat(this._openingMessage.attachments || []);

// 		// linkMessage.urls = [{ url: this._getMessageUrl(repostedMessage._id) }];

// 		// // we want to create a system message for linking the thread from the parent room - so the parent room
// 		// // has to support system messages at least for this interaction
// 		// if (!parentRoom.sysMes) {
// 		// 	RocketChat.models.Rooms.setSystemMessagesById(parentRoom._id, true);
// 		// }
// 		// const createdLinkMessage = RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('create-thread', parentRoom._id, this._getMessageUrl(repostedMessage._id), this.rocketCatUser, linkMessage, { ts: this._openingMessage.ts });

// 		// // reset it if necessary
// 		// if (!parentRoom.sysMes) {
// 		// 	RocketChat.models.Rooms.setSystemMessagesById(parentRoom._id, false);
// 		// }

// 		// // finally, propagate the message ID of the system message in the parent to the thread
// 		// // so that this system message can be updated on changes of the thread.
// 		// // this redundancy is neccessary in order to re-render the actually non-reactive message list
// 		// // in order to update the visualized thread metadata (e. g. last message ts) on the link message
// 		// RocketChat.models.Rooms.setLinkMessageById(roomCreated._id, createdLinkMessage._id);
// 		// return true;
// 	}

// 	_threadWelcomeMessage(threadRoom, parentRoom) {
// 		const user = Meteor.user();
// 		const welcomeMessage = {
// 			_id: Random.id(),
// 			rid: threadRoom._id,
// 			mentions: [{
// 				_id: user._id, // Thread Initiator
// 				name: user.username, // Use @Name field for navigation
// 			}],
// 			channels: [{
// 				_id: parentRoom._id,
// 				name: parentRoom.name,
// 			}],
// 		};
// 		return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('thread-welcome', threadRoom._id, '', this.rocketCatUser, welcomeMessage);
// 	}

// 	_getMembers() {
// 		const checkRoles = ['owner', 'moderator', 'leader'];
// 		const maxInvitationCount = Math.max(RocketChat.models.Settings.findOneById('Thread_invitations_threshold').value, 0) || 0;
// 		let members = [];
// 		const admins = RocketChat.models.Subscriptions.findByRoomIdAndRoles(this._parentRoomId, checkRoles).fetch().map((s) => ({
// 			username: s.u.username,
// 		}));
// 		const users = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(this._parentRoomId, {
// 			fields: {
// 				'u._id': 1,
// 				'u.username': 1,
// 			},
// 			sort: {
// 				open: -1,
// 				ls: -1,
// 			},
// 		}).fetch().map((s) => ({
// 			id: s.u._id,
// 			username: s.u.username,
// 		}));
// 		if (this._parentRoom.t === 'c') {
// 			// only add online users
// 			members = RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(users.slice(0, maxInvitationCount).map((user) => user.id)).fetch().map((user) => user.username);
// 			// add admins to the member list and avoid duplicates
// 			members = Array.from(new Set(members.concat(admins.map((user) => user.username))));
// 		} else {
// 			// in direct messages and groups, add all users as members of the thread
// 			members = users.map((user) => user.username);
// 		}
// 		return members;
// 	}

// 	create({ prid, pmid, t_name, reply, users }) {
// 		const threadRoomType = this._parentRoom.t === 'd' ? 'p' : this._parentRoom.t;
// 		const threadRoomCreationResult = RocketChat.createRoom(threadRoomType, this.name, Meteor.user() && Meteor.user().username, this._getMembers(), false,
// 			{
// 				description: this._openingMessage.msg,
// 				topic: this._parentRoom.name ? this._parentRoom.name : '',
// 				parentRoomId: this._parentRoomId,
// 				openingMessageId: this._openingMessage._id,
// 			});

// 		// Create messages in the newly created thread and it's parent which link the two rooms
// 		const threadRoom = RocketChat.models.Rooms.findOneById(threadRoomCreationResult.rid);
// 		if (threadRoom && this._parentRoom) {
// 			this._threadWelcomeMessage(threadRoom, this._parentRoom);

// 			// Post message
// 			const repostedMessage = this._postMessage(
// 				threadRoom,
// 				this._openingMessage.u,
// 				this._openingMessage.msg,
// 				this._openingMessage.attachments ? this._openingMessage.attachments.filter((attachment) => attachment.type && attachment.type === 'file') : []
// 			);

// 			// Create messages linking the parent room and the thread
// 			this._linkMessages(threadRoom, this._parentRoom, repostedMessage);
// 		}

// 		return threadRoom;
// 	}
// }

const fields = [
	{
		type: 'messageCounter',
		count: 0,
	},
	{
		type: 'lastMessageAge',
		lm: null,
	},
];

export const createThreadMessage = (rid, user, t_rid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		t_rid,
		attachments: [{
			fields,
		}, message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('thread-created', t_rid, '', user, welcomeMessage);
};

export const mentionThreadMessage = (rid, user, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		attachments: [message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('thread-created', rid, '', user, welcomeMessage);
};

const cloneMessage = ({ _id, ...msg }) => ({ ...msg });

export const create = ({ prid, pmid, t_name, reply, users }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (pmid) {
		message = Messages.findOne({ _id: pmid });
		if (prid) {
			if (prid !== message.rid) {
				throw new Meteor.Error('error-invalid-arguments', { method: 'ThreadCreation' });
			}
		} else {
			prid = message.rid;
		}
	}

	if (!prid) {
		throw new Meteor.Error('error-invalid-arguments', { method: 'ThreadCreation' });
	}
	const p_room = Rooms.findOne(prid);
	const user = Meteor.user();

	if (!canAccessRoom(p_room, user)) {
		throw new Meteor.Error('error-not-allowed', { method: 'ThreadCreation' });
	}

	const t_type = p_room.t;


	if (pmid) {
		const threadAlreadyExists = Rooms.findOne({
			prid,
			pmid,
		}, {
			fields: { _id: 1 },
		});
		if (threadAlreadyExists) { // do not allow multiple threads to the same message'\
			addUserToRoom(threadAlreadyExists._id, user);
			return threadAlreadyExists;
		}
	}

	const name = Random.id();

	const invitedUsers = message ? [message.u.username, ...users] : users; // auto invite the replied message owner
	const thread = createRoom(t_type, name, user.username, invitedUsers, false, {
		fname: t_name,
		description: message.msg, // TODO threads remove
		topic: p_room.name, // TODO threads remove
		prid,
	});

	if (pmid) {
		const message_cloned = cloneMessage(message);

		Messages.update({
			_id: message._id,
		}, {
			...message_cloned,
			attachments: [{
				fields,
			}, ...(message_cloned.attachments || [])],
			t_rid: thread._id,
		});


		mentionThreadMessage(thread._id, user, reply, attachMessage(message_cloned, p_room));

		// Messages.insert({
		// 	...message_cloned,
		// 	rid: thread._id,
		// });
	} else {
		createThreadMessage(prid, user, thread._id, reply);
		if (reply) {
			sendMessage(user, { msg: reply }, thread);
		}
	}
	return thread;
};

Meteor.methods({
	/**
	* Create thread by room or message
	* @constructor
	* @param {string} prid - Parent Room Id - The room id, optional if you send pmid.
	* @param {string} pmid - Parent Message Id - Create the thread by a message, optional.
	* @param {string} reply - The reply, optional
	* @param {string} t_name - thread name
	* @param {string[]} users - users to be added
	*/
	createThread({ prid, pmid, t_name, reply, users }) {

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ThreadCreation' });
		}

		if (!hasAtLeastOnePermission(uid, ['start-thread', 'start-thread-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a thread', { method: 'createThread' });
		}

		return create({ uid, prid, pmid, t_name, reply, users });
	},
});
