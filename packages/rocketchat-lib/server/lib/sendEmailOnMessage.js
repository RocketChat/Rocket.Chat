RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	var emailSubject, mentionIds = [];

	if (room.t === 'd') {
		mentionIds.push(message.rid.replace(message.u._id, ''));

		emailSubject = TAPi18n.__("Offline_DM_Email", {
			site: RocketChat.settings.get('Site_Name'),
			user: message.u.username
		});

	} else {
		if (message.mentions) {
			message.mentions.forEach(function(mention) {
				return mentionIds.push(mention._id);
			});
		}

		emailSubject = TAPi18n.__("Offline_Mention_Email", {
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
	message.html = message.html.replace(/\n/gm, '<br/>');

	if (mentionIds.length > 0) {
		var usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(mentionIds).fetch();

		if (usersOfMention && usersOfMention.length > 0) {
			usersOfMention.forEach((user) => {
				user.emails.some((email) => {
					if (email.verified) {
						var email = {
							to: email.address,
							from: RocketChat.settings.get('From_Email'),
							subject: emailSubject,
							html: "&gt; " + message.html
						};

						Email.send(email);

						return true;
					}
				});
			});
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW);
