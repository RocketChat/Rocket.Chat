import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import s from 'underscore.string';
import * as Mailer from 'meteor/rocketchat:mailer';

let advice = '';
let goToMessage = '';
Meteor.startup(() => {
	RocketChat.settings.get('email_style', function() {
		goToMessage = Mailer.inlinecss('<p><a class=\'btn\' href="[room_path]">{Offline_Link_Message}</a></p>');
	});
	Mailer.getTemplate('Email_Footer_Direct_Reply', (value) => {
		advice = value;
	});
});

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

		if (message.t === 'e2e') {
			messageContent = TAPi18n.__('Encrypted_message', { lng });
		}

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

export function sendEmail({ message, user, subscription, room, emailAddress, hasMentionToUser }) {
	const username = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name : message.u.username;
	let subjectKey = 'Offline_Mention_All_Email';

	if (room.t === 'd') {
		subjectKey = 'Offline_DM_Email';
	} else if (hasMentionToUser) {
		subjectKey = 'Offline_Mention_Email';
	}

	const emailSubject = Mailer.replace(RocketChat.settings.get(subjectKey), {
		user: username,
		room: RocketChat.roomTypes.getRoomName(room.t, room),
	});
	const content = getEmailContent({
		message,
		user,
		room,
	});

	const room_path = RocketChat.roomTypes.getURL(room.t, subscription);

	const email = {
		to: emailAddress,
		subject: emailSubject,
		html: content + goToMessage + (RocketChat.settings.get('Direct_Reply_Enable') ? advice : ''),
		data: {
			room_path,
		},
	};

	const from = room.t === 'd' ? message.u.name : room.name;	// using user full-name/channel name in from address
	email.from = `${ String(from).replace(/@/g, '%40').replace(/[<>,]/g, '') } <${ RocketChat.settings.get('From_Email') }>`;
	// If direct reply enabled, email content with headers
	if (RocketChat.settings.get('Direct_Reply_Enable')) {
		const replyto = RocketChat.settings.get('Direct_Reply_ReplyTo') || RocketChat.settings.get('Direct_Reply_Username');
		email.headers = {
			// Reply-To header with format "username+messageId@domain"
			'Reply-To': `${ replyto.split('@')[0].split(RocketChat.settings.get('Direct_Reply_Separator'))[0] }${ RocketChat.settings.get('Direct_Reply_Separator') }${ message._id }@${ replyto.split('@')[1] }`,
		};
	}

	RocketChat.metrics.notificationsSent.inc({ notification_type: 'email' });
	return Mailer.send(email);
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
		if (disableAllMessageNotifications && !isHighlighted && !hasMentionToUser) {
			return false;
		}

		// default server preference is disabled
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_emailNotificationMode') === 'nothing') {
			return false;
		}
	}

	return roomType === 'd' || isHighlighted || emailNotifications === 'all' || hasMentionToUser || (!disableAllMessageNotifications && hasMentionToAll);
}
