import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { ltrim } from '../../../../../lib/utils/stringUtils';
import { i18n } from '../../../../../server/lib/i18n';
import { roomCoordinator } from '../../../../../server/lib/rooms/roomCoordinator';
import * as Mailer from '../../../../mailer/server/api';
import { metrics } from '../../../../metrics/server';
import { settings } from '../../../../settings/server';
import { getURL } from '../../../../utils/server/getURL';

let advice = '';
let goToMessage = '';
Meteor.startup(() => {
	settings.watch('email_style', () => {
		goToMessage = Mailer.inlinecss('<p><a class=\'btn\' href="[room_path]">{Offline_Link_Message}</a></p>');
	});
	Mailer.getTemplate('Email_Footer_Direct_Reply', (value) => {
		advice = value;
	});
});

export async function getEmailContent({ message, user, room }) {
	const lng = (user && user.language) || settings.get('Language') || 'en';

	const roomName = escapeHTML(`#${await roomCoordinator.getRoomName(room.t, room)}`);
	const userName = escapeHTML(settings.get('UI_Use_Real_Name') ? message.u.name || message.u.username : message.u.username);

	const roomDirectives = roomCoordinator.getRoomDirectives(room.t);

	const header = i18n.t(!roomDirectives.isGroupChat(room) ? 'User_sent_a_message_to_you' : 'User_sent_a_message_on_channel', {
		username: userName,
		channel: roomName,
		lng,
	});

	if (message.t === 'e2e' && !message.file) {
		return settings.get('Email_notification_show_message') ? i18n.t('Encrypted_message_preview_unavailable', { lng }) : header;
	}

	if (message.msg !== '') {
		if (!settings.get('Email_notification_show_message')) {
			return header;
		}

		let messageContent = escapeHTML(message.msg);

		message = await callbacks.run('renderMessage', message);
		if (message.tokens && message.tokens.length > 0) {
			message.tokens.forEach((token) => {
				token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
				messageContent = messageContent.replace(token.token, token.text);
			});
		}
		return `${header}:<br/><br/>${messageContent.replace(/\n/gm, '<br/>')}`;
	}

	if (message.file) {
		const fileHeader = i18n.t(!roomDirectives.isGroupChat(room) ? 'User_uploaded_a_file_to_you' : 'User_uploaded_a_file_on_channel', {
			username: userName,
			channel: roomName,
			lng,
		});

		if (!settings.get('Email_notification_show_message')) {
			return fileHeader;
		}

		let content = `${escapeHTML(message.file.name)}`;

		if (message.attachments && message.attachments.length === 1 && message.attachments[0].description !== '') {
			content += `<br/><br/>${escapeHTML(message.attachments[0].description)}`;
		}

		return `${fileHeader}:<br/><br/>${content}`;
	}

	if (!settings.get('Email_notification_show_message')) {
		return header;
	}

	if (Array.isArray(message.attachments) && message.attachments.length > 0) {
		const [attachment] = message.attachments;

		let content = '';

		if (attachment.title) {
			content += `${escapeHTML(attachment.title)}<br/>`;
		}
		if (attachment.text) {
			content += `${escapeHTML(attachment.text)}<br/>`;
		}

		return `${header}:<br/><br/>${content}`;
	}

	return header;
}

const getButtonUrl = (room, subscription, message) => {
	const basePath = roomCoordinator.getRouteLink(room.t, subscription).replace(Meteor.absoluteUrl(), '');

	const path = `${ltrim(basePath, '/')}?msg=${message._id}`;
	return getURL(
		path,
		{
			full: true,
			cloud: settings.get('Offline_Message_Use_DeepLink'),
			cloud_route: 'room',
			cloud_params: {
				rid: room._id,
				mid: message._id,
			},
		},
		settings.get('DeepLink_Url'),
	);
};

function generateNameEmail(name, email) {
	return `${String(name).replace(/@/g, '%40').replace(/[<>,]/g, '')} <${email}>`;
}

export async function getEmailData({ message, receiver, sender, subscription, room, emailAddress, hasMentionToUser }) {
	const username = settings.get('UI_Use_Real_Name') ? message.u.name || message.u.username : message.u.username;
	let subjectKey = 'Offline_Mention_All_Email';

	if (!roomCoordinator.getRoomDirectives(room.t).isGroupChat(room)) {
		subjectKey = 'Offline_DM_Email';
	} else if (hasMentionToUser) {
		subjectKey = 'Offline_Mention_Email';
	}

	const emailSubject = Mailer.replace(settings.get(subjectKey), {
		user: username,
		room: await roomCoordinator.getRoomName(room.t, room),
	});
	const content = await getEmailContent({
		message,
		user: receiver,
		room,
	});

	const room_path = getButtonUrl(room, subscription, message);

	const receiverName = settings.get('UI_Use_Real_Name') ? receiver.name || receiver.username : receiver.username;

	const email = {
		from: generateNameEmail(username, settings.get('From_Email')),
		to: generateNameEmail(receiverName, emailAddress),
		subject: emailSubject,
		html: content + goToMessage + (settings.get('Direct_Reply_Enable') ? advice : ''),
		data: {
			room_path,
		},
		headers: {},
	};

	if (sender.emails?.length > 0 && settings.get('Add_Sender_To_ReplyTo')) {
		const [senderEmail] = sender.emails;
		email.headers['Reply-To'] = generateNameEmail(username, senderEmail.address);
	}

	// If direct reply enabled, email content with headers
	if (settings.get('Direct_Reply_Enable')) {
		const replyto = settings.get('Direct_Reply_ReplyTo') || settings.get('Direct_Reply_Username');

		// Reply-To header with format "username+messageId@domain"
		email.headers['Reply-To'] = `${replyto.split('@')[0].split(settings.get('Direct_Reply_Separator'))[0]}${settings.get(
			'Direct_Reply_Separator',
		)}${message.tmid || message._id}@${replyto.split('@')[1]}`;
	}

	metrics.notificationsSent.inc({ notification_type: 'email' });
	return email;
}

export function sendEmailFromData(data) {
	metrics.notificationsSent.inc({ notification_type: 'email' });
	return Mailer.send(data);
}

export function shouldNotifyEmail({
	disableAllMessageNotifications,
	statusConnection,
	emailNotifications,
	isHighlighted,
	hasMentionToUser,
	hasMentionToAll,
	hasReplyToThread,
	roomType,
	isThread,
}) {
	// email notifications are disabled globally
	if (!settings.get('Accounts_AllowEmailNotifications')) {
		return false;
	}

	// user/room preference to nothing
	if (emailNotifications === 'nothing') {
		return false;
	}

	// user connected (don't need to send him an email)
	if (statusConnection === 'online') {
		return false;
	}

	// no user or room preference
	if (emailNotifications == null) {
		if (disableAllMessageNotifications && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
			return false;
		}

		// default server preference is disabled
		if (settings.get('Accounts_Default_User_Preferences_emailNotificationMode') === 'nothing') {
			return false;
		}
	}

	return (
		(roomType === 'd' ||
			isHighlighted ||
			emailNotifications === 'all' ||
			hasMentionToUser ||
			(!disableAllMessageNotifications && hasMentionToAll)) &&
		(isHighlighted || !isThread || hasReplyToThread)
	);
}
