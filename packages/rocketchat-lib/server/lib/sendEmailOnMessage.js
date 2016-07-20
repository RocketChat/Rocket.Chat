RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	var emailSubject, usersToSendEmail = {};
	var directMessage = room.t === 'd';

	if (directMessage) {
		usersToSendEmail[message.rid.replace(message.u._id, '')] = 1;

		emailSubject = TAPi18n.__('Offline_DM_Email', {
			user: message.u.username
		});

	} else {
		if (message.mentions) {
			message.mentions.forEach(function(mention) {
				usersToSendEmail[mention._id] = 1;
			});
		}

		emailSubject = TAPi18n.__('Offline_Mention_Email', {
			user: message.u.username,
			room: room.name
		});
	}

	var getMessageLink = () => {
		var path, label;
		if (directMessage) {
			path = `direct/${ room.username }`;
			label = room.username;
		} else {
			path = `channel/${ room.name }`;
			label = `#${ room.name }`;
		}
		var link = `<a style="color: #008ce3;" href="${ process.env.ROOT_URL }${ path }">${ label }</a>`;
		return `<span style="margin-top: 10px; display: block;">${ emailSubject.replace(label, link) }</span>`;
	};

	var divisorMessage = '<hr style="margin: 20px auto; border: none; border-bottom: 1px solid #dddddd;">';
	message.html = getMessageLink() + divisorMessage + s.escapeHTML(message.msg);

	message = RocketChat.callbacks.run('renderMessage', message);
	if (message.tokens && message.tokens.length > 0) {
		message.tokens.forEach((token) => {
			token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
			message.html = message.html.replace(token.token, token.text);
		});
	}


	var header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	var footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
	message.html = header + message.html.replace(/\n/gm, '<br/>') + footer;

	RocketChat.models.Subscriptions.findWithSendEmailByRoomId(room._id).forEach((sub) => {
		switch (sub.emailNotifications) {
			case 'all':
				usersToSendEmail[sub.u._id] = 'force';
				break;
			case 'mentions':
				if (usersToSendEmail[sub.u._id]) {
					usersToSendEmail[sub.u._id] = 'force';
				}
				break;
			case 'nothing':
				delete usersToSendEmail[sub.u._id];
				break;
			case 'default':
				break;
		}
	});

	var userIdsToSendEmail = Object.keys(usersToSendEmail);

	if (userIdsToSendEmail.length > 0) {
		var usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(userIdsToSendEmail).fetch();

		if (usersOfMention && usersOfMention.length > 0) {
			var siteName = RocketChat.settings.get('Site_Name');

			usersOfMention.forEach((user) => {
				if (user.settings && user.settings.preferences && user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode === 'disabled' && usersToSendEmail[user._id] !== 'force') {
					return;
				}

				// Checks if user is in the room he/she is mentioned (unless it's public channel)
				if (room.t !== 'c' && room.usernames.indexOf(user.username) === -1) {
					return;
				}

				user.emails.some((email) => {
					if (email.verified) {
						email = {
							to: email.address,
							from: RocketChat.settings.get('From_Email'),
							subject: `[${ siteName }] ${ emailSubject }`,
							html: '&gt; ' + message.html
						};

						Email.send(email);

						return true;
					}
				});
			});
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendEmailOnMessage');
