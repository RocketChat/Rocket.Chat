import moment from 'moment';

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
	const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
	messageHTML = messageHTML.replace(/\n/gm, '<br/>');

	const usersToSendEmail = {};
	if (room.t === 'd') {
		usersToSendEmail[message.rid.replace(message.u._id, '')] = 'direct';
	} else {
		RocketChat.models.Subscriptions.findWithSendEmailByRoomId(room._id).forEach((sub) => {
			if (sub.disableNotifications) {
				return delete usersToSendEmail[sub.u._id];
			}

			const emailNotifications = sub.emailNotifications;

			if (emailNotifications !== 'nothing') {
				const mentionedUser = message.mentions.find((mention) => {
					return mention._id === sub.u._id;
				});

				if (emailNotifications === 'mentions' || mentionedUser) {
					return usersToSendEmail[sub.u._id] = 'mention';
				}

				if (emailNotifications === 'all') {
					return usersToSendEmail[sub.u._id] = 'all';
				}
			}
			delete usersToSendEmail[sub.u._id];
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
		defaultLink = getMessageLink(room, { name: room.name });
	}

	if (userIdsToSendEmail.length > 0) {
		const usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(userIdsToSendEmail).fetch();

		if (usersOfMention && usersOfMention.length > 0) {
			const siteName = RocketChat.settings.get('Site_Name');

			usersOfMention.forEach((user) => {
				if (user.settings && user.settings.preferences && user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode === 'disabled' && usersToSendEmail[user._id] !== 'force') {
					return;
				}

				// Checks if user is in the room he/she is mentioned (unless it's public channel)
				if (room.t !== 'c' && room.usernames.indexOf(user.username) === -1) {
					return;
				}

				let emailSubject;
				switch (usersToSendEmail[user._id]) {
					case 'all':
						emailSubject = TAPi18n.__('Offline_Mention_All_Email', {
							user: message.u.username,
							room: room.name || room.label
						});
						break;
					case 'direct':
						emailSubject = TAPi18n.__('Offline_DM_Email', {	user: message.u.username });
						break;
					case 'mention':
						emailSubject = TAPi18n.__('Offline_Mention_Email', {
							user: message.u.username,
							room: room.name
						});
						break;
				}
				user.emails.some((email) => {
					if (email.verified) {
						email = {
							to: email.address,
							from: RocketChat.settings.get('From_Email'),
							subject: `[${ siteName }] ${ emailSubject }`,
							html: header + messageHTML + divisorMessage + (linkByUser[user._id] || defaultLink) + footer
						};

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
