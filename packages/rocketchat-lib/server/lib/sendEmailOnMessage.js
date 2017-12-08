import moment from 'moment';
import s from 'underscore.string';

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	const getMessageLink = (room, sub) => {
		const roomPath = RocketChat.roomTypes.getRouteLink(room.t, sub);
		const path = Meteor.absoluteUrl(roomPath ? roomPath.replace(/^\//, '') : '');
		const style = [
			'color: #fff;',
			'padding: 9px 12px;',
			'border-radius: 4px;',
			'background-color: #04436a;',
			'text-decoration: none;'
		].join(' ');
		const message = TAPi18n.__('Offline_Link_Message');
		return `<p style="text-align:center;margin-bottom:8px;"><a style="${ style }" href="${ path }">${ message }</a>`;
	};

	const divisorMessage = '<hr style="margin: 20px auto; border: none; border-bottom: 1px solid #dddddd;">';
	let messageHTML = s.escapeHTML(message.msg);

	message = RocketChat.callbacks.run('renderMessage', message);
	if (message.tokens && message.tokens.length > 0) {
		message.tokens.forEach((token) => {
			token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
			messageHTML = messageHTML.replace(token.token, token.text);
		});
	}

	const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	let footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
	messageHTML = messageHTML.replace(/\n/gm, '<br/>');

	const usersToSendEmail = {};
	if (room.t === 'd') {
		usersToSendEmail[message.rid.replace(message.u._id, '')] = 'direct';
	} else {
		let isMentionAll = message.mentions.find(mention => mention._id === 'all');

		if (isMentionAll) {
			const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
			if (maxMembersForNotification !== 0 && room.usernames.length > maxMembersForNotification) {
				isMentionAll = undefined;
			}
		}

		let query;
		if (isMentionAll) {
			// Query all users in room limited by the max room members setting
			query = RocketChat.models.Subscriptions.findByRoomId(room._id);
		} else {
			// Query only mentioned users, will be always a few users
			const userIds = message.mentions.map(mention => mention._id);
			query = RocketChat.models.Subscriptions.findByRoomIdAndUserIdsOrAllMessages(room._id, userIds);
		}

		query.forEach((sub) => {
			if (sub.disableNotifications) {
				return delete usersToSendEmail[sub.u._id];
			}

			const emailNotifications = sub.emailNotifications;

			if (emailNotifications === 'nothing') {
				return delete usersToSendEmail[sub.u._id];
			}

			const mentionedUser = isMentionAll || message.mentions.find(mention => mention._id === sub.u._id);

			if (emailNotifications === 'default' || emailNotifications == null) {
				if (mentionedUser) {
					return usersToSendEmail[sub.u._id] = 'default';
				}
				return delete usersToSendEmail[sub.u._id];
			}

			if (emailNotifications === 'mentions' && mentionedUser) {
				return usersToSendEmail[sub.u._id] = 'mention';
			}

			if (emailNotifications === 'all') {
				return usersToSendEmail[sub.u._id] = 'all';
			}
		});
	}
	const userIdsToSendEmail = Object.keys(usersToSendEmail);

	let defaultLink;

	const linkByUser = {};
	if (RocketChat.roomTypes.hasCustomLink(room.t)) {
		RocketChat.models.Subscriptions.findByRoomIdAndUserIds(room._id, userIdsToSendEmail).forEach((sub) => {
			linkByUser[sub.u._id] = getMessageLink(room, sub);
		});
	} else {
		defaultLink = getMessageLink(room, {
			name: room.name
		});
	}

	if (userIdsToSendEmail.length > 0) {
		const usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(userIdsToSendEmail).fetch();

		if (usersOfMention && usersOfMention.length > 0) {
			usersOfMention.forEach((user) => {
				if (usersToSendEmail[user._id] === 'default') {
					if (!user.settings || !user.settings.preferences || !user.settings.preferences.emailNotificationMode || user.settings.preferences.emailNotificationMode === 'all') { //Mention/DM
						usersToSendEmail[user._id] = 'mention';
					} else {
						return;
					}
				}

				if (usersToSendEmail[user._id] === 'direct') {
					const userEmailPreferenceIsDisabled = user.settings && user.settings.preferences && user.settings.preferences.emailNotificationMode && (user.settings.preferences.emailNotificationMode === 'disabled');
					const directMessageEmailPreference = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, message.rid.replace(message.u._id, '')).emailNotifications;

					if (directMessageEmailPreference === 'nothing') {
						return;
					}

					if ((directMessageEmailPreference === 'default' || directMessageEmailPreference == null) && userEmailPreferenceIsDisabled) {
						return;
					}
				}

				// Checks if user is in the room he/she is mentioned (unless it's public channel)
				if (room.t !== 'c' && room.usernames.indexOf(user.username) === -1) {
					return;
				}

				// Footer in case direct reply is enabled.
				if (RocketChat.settings.get('Direct_Reply_Enable')) {
					footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer_Direct_Reply') || '');
				}

				let emailSubject;
				const username = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name : message.u.username;
				const roomName = RocketChat.settings.get('UI_Allow_room_names_with_special_chars') ? room.fname : room.name;
				switch (usersToSendEmail[user._id]) {
					case 'all':
						emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_All_Email'), {
							user: username,
							room: roomName || room.label
						});
						break;
					case 'direct':
						emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_DM_Email'), {
							user: username,
							room: roomName
						});
						break;
					case 'mention':
						emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_Email'), {
							user: username,
							room: roomName
						});
						break;
				}
				user.emails.some((email) => {
					if (email.verified) {
						email = {
							to: email.address,
							from: RocketChat.settings.get('From_Email'),
							subject: emailSubject,
							html: header + messageHTML + divisorMessage + (linkByUser[user._id] || defaultLink) + footer
						};
						// If direct reply enabled, email content with headers
						if (RocketChat.settings.get('Direct_Reply_Enable')) {
							email.headers = {
								// Reply-To header with format "username+messageId@domain"
								'Reply-To': `${ RocketChat.settings.get('Direct_Reply_Username').split('@')[0].split(RocketChat.settings.get('Direct_Reply_Separator'))[0] }${ RocketChat.settings.get('Direct_Reply_Separator') }${ message._id }@${ RocketChat.settings.get('Direct_Reply_Username').split('@')[1] }`
							};
						}

						Meteor.defer(() => {
							Email.send(email);
						});

						return true;
					}
				});
			});
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendEmailOnMessage');
