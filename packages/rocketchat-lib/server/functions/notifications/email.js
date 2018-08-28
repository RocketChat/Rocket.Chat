import s from 'underscore.string';

let contentHeader;
RocketChat.settings.get('Email_Header', (key, value) => {
	contentHeader = RocketChat.placeholders.replace(value || '');
});

let contentFooter;
RocketChat.settings.get('Email_Footer', (key, value) => {
	contentFooter = RocketChat.placeholders.replace(value || '');
});

const divisorMessage = '<hr style="margin: 20px auto; border: none; border-bottom: 1px solid #dddddd;">';

function getEmailContent({ message, user, room }) {
	const lng = (user && user.language) || RocketChat.settings.get('language') || 'en';

	const roomName = s.escapeHTML(`#${ RocketChat.roomTypes.getRoomName(room.t, room) }`);
	const userName = s.escapeHTML(RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name || message.u.username : message.u.username);

	const header = TAPi18n.__(room.t === 'd' ? 'User_sent_a_message_to_you' : 'User_sent_a_message_on_channel', {
		username: userName,
		channel: roomName,
		lng,
	});

	if (message.msg !== '') {
		let messageContent = s.escapeHTML(message.msg);
		message = RocketChat.callbacks.run('renderMessage', message);
		if (message.tokens && message.tokens.length > 0) {
			message.tokens.forEach((token) => {
				token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
				messageContent = messageContent.replace(token.token, token.text);
			});
		}
		return `${ header }<br/><br/>${ messageContent.replace(/\n/gm, '<br/>') }`;
	}

	if (message.file) {
		const fileHeader = TAPi18n.__(room.t === 'd' ? 'User_uploaded_a_file_to_you' : 'User_uploaded_a_file_on_channel', {
			username: userName,
			channel: roomName,
			lng,
		});

		let content = `${ TAPi18n.__('Attachment_File_Uploaded') }: ${ s.escapeHTML(message.file.name) }`;

		if (message.attachments && message.attachments.length === 1 && message.attachments[0].description !== '') {
			content += `<br/><br/>${ s.escapeHTML(message.attachments[0].description) }`;
		}

		return `${ fileHeader }<br/><br/>${ content }`;
	}

	if (message.attachments.length > 0) {
		const [attachment] = message.attachments;

		let content = '';

		if (attachment.title) {
			content += `${ s.escapeHTML(attachment.title) }<br/>`;
		}
		if (attachment.text) {
			content += `${ s.escapeHTML(attachment.text) }<br/>`;
		}

		return `${ header }<br/><br/>${ content }`;
	}

	return header;
}

function getMessageLink(room, sub) {
	const roomPath = RocketChat.roomTypes.getURL(room.t, sub);
	const style = [
		'color: #fff;',
		'padding: 9px 12px;',
		'border-radius: 4px;',
		'background-color: #04436a;',
		'text-decoration: none;',
	].join(' ');
	const message = TAPi18n.__('Offline_Link_Message');
	return `<p style="text-align:center;margin-bottom:8px;"><a style="${ style }" href="${ roomPath }">${ message }</a>`;
}

export function sendEmail({ message, user, subscription, room, emailAddress, hasMentionToUser }) {
	let emailSubject;
	const username = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name : message.u.username;

	if (room.t === 'd') {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_DM_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room),
		});
	} else if (hasMentionToUser) {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room),
		});
	} else {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_All_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room),
		});
	}
	const content = getEmailContent({
		message,
		user,
		room,
	});

	const link = getMessageLink(room, subscription);

	if (RocketChat.settings.get('Direct_Reply_Enable')) {
		contentFooter = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer_Direct_Reply') || '');
	}

	const email = {
		to: emailAddress,
		subject: emailSubject,
		html: contentHeader + content + divisorMessage + link + contentFooter,
	};

	// using user full-name/channel name in from address
	if (room.t === 'd') {
		email.from = `${ String(message.u.name).replace(/@/g, '%40').replace(/[<>,]/g, '') } <${ RocketChat.settings.get('From_Email') }>`;
	} else {
		email.from = `${ String(room.name).replace(/@/g, '%40').replace(/[<>,]/g, '') } <${ RocketChat.settings.get('From_Email') }>`;
	}
	// If direct reply enabled, email content with headers
	if (RocketChat.settings.get('Direct_Reply_Enable')) {
		const replyto = RocketChat.settings.get('Direct_Reply_ReplyTo') ? RocketChat.settings.get('Direct_Reply_ReplyTo') : RocketChat.settings.get('Direct_Reply_Username');
		email.headers = {
			// Reply-To header with format "username+messageId@domain"
			'Reply-To': `${ replyto.split('@')[0].split(RocketChat.settings.get('Direct_Reply_Separator'))[0] }${ RocketChat.settings.get('Direct_Reply_Separator') }${ message._id }@${ replyto.split('@')[1] }`,
		};
	}

	Meteor.defer(() => {
		RocketChat.metrics.notificationsSent.inc({ notification_type: 'email' });
		Email.send(email);
	});
}

export function shouldNotifyEmail({
	disableAllMessageNotifications,
	statusConnection,
	emailNotifications,
	isHighlighted,
	hasMentionToUser,
	hasMentionToAll,
	roomType,
}) {

	// use connected (don't need to send him an email)
	if (statusConnection === 'online') {
		return false;
	}

	// user/room preference to nothing
	if (emailNotifications === 'nothing') {
		return false;
	}

	// no user or room preference
	if (emailNotifications == null) {
		if (disableAllMessageNotifications) {
			return false;
		}

		// default server preference is disabled
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_emailNotificationMode') === 'nothing') {
			return false;
		}
	}

	return roomType === 'd' || isHighlighted || emailNotifications === 'all' || hasMentionToUser || (!disableAllMessageNotifications && hasMentionToAll);
}
