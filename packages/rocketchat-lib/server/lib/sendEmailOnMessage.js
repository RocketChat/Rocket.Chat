RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	var emailSubject, usersToSendEmail = {};

	if (room.t === 'd') {
		usersToSendEmail[message.rid.replace(message.u._id, '')] = 1;

		emailSubject = TAPi18n.__('Offline_DM_Email', {
			site: RocketChat.settings.get('Site_Name'),
			user: message.u.username
		});

	} else {
		if (message.mentions) {
			message.mentions.forEach(function(mention) {
				usersToSendEmail[mention._id] = 1;
			});
		}

		emailSubject = TAPi18n.__('Offline_Mention_Email', {
			site: RocketChat.settings.get('Site_Name'),
			user: message.u.username,
			room: room.name
		});
	}

	// code duplicate of packages/rocketchat-ui-message/message/message.coffee
	message.html = s.escapeHTML(message.msg);
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
							subject: emailSubject,
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
