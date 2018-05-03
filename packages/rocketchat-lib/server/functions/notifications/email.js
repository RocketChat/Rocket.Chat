import s from 'underscore.string';

const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
let footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
const divisorMessage = '<hr style="margin: 20px auto; border: none; border-bottom: 1px solid #dddddd;">';

function getEmailContent({ message, user, room }) {
	const lng = user && user.language || RocketChat.settings.get('language') || 'en';

	const roomName = `#${ RocketChat.settings.get('UI_Allow_room_names_with_special_chars') ? room.fname || room.name : room.name }`;
	const userName = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name || message.u.username : message.u.username;

	const header = TAPi18n.__(room.t === 'd' ? 'User_sent_a_message_to_you' : 'User_sent_a_message_on_channel', {
		username: userName,
		channel: roomName,
		lng
	});

	let messageContent;
	if (message.msg !== '') {
		messageContent = s.escapeHTML(message.msg);
		message = RocketChat.callbacks.run('renderMessage', message);
		if (message.tokens && message.tokens.length > 0) {
			message.tokens.forEach((token) => {
				token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
				messageContent = messageContent.replace(token.token, token.text);
			});
		}
		messageContent = messageContent.replace(/\n/gm, '<br/>');
	}

	if (messageContent) {
		return `${ header }<br/><br/>${ messageContent }`;
	}

	if (message.file) {
		const fileHeader = TAPi18n.__(room.t === 'd' ? 'User_uploaded_a_file_to_you' : 'User_uploaded_a_file_on_channel', {
			username: userName,
			channel: roomName,
			lng
		});

		let content = `${ TAPi18n.__('Attachment_File_Uploaded') }: ${ message.file.name }`;

		if (message.attachments && message.attachments.length === 1 && message.attachments[0].description !== '') {
			content += `<br/><br/>${ message.attachments[0].description }`;
		}

		return `${ fileHeader }<br/><br/>${ content }`;
	}

	if (message.attachments.length > 0) {
		const [ attachment ] = message.attachments;

		let content = '';

		if (attachment.title) {
			content += `${ attachment.title }<br/>`;
		}
		if (attachment.text) {
			content += `${ attachment.text }<br/>`;
		}

		return `${ header }<br/><br/>${ content }`;
	}

	return header;
}

function getMessageLink(room, sub) {
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
}

export function sendEmail({ message, user, subscription, room, emailAddress, toAll }) {
	let emailSubject;
	const username = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name : message.u.username;

	if (room.t === 'd') {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_DM_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room)
		});
	} else if (toAll) {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_All_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room)
		});
	} else {
		emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_Email'), {
			user: username,
			room: RocketChat.roomTypes.getRoomName(room.t, room)
		});
	}
	const content = getEmailContent({
		message,
		user,
		room
	});

	const link = getMessageLink(room, subscription);

	if (RocketChat.settings.get('Direct_Reply_Enable')) {
		footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer_Direct_Reply') || '');
	}

	const email = {
		to: emailAddress,
		subject: emailSubject,
		html: header + content + divisorMessage + link + footer
	};

	// using user full-name/channel name in from address
	if (room.t === 'd') {
		email.from = `${ message.u.name } <${ RocketChat.settings.get('From_Email') }>`;
	} else {
		email.from = `${ room.name } <${ RocketChat.settings.get('From_Email') }>`;
	}
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
}

export function shouldNotifyEmail({ disableAllMessageNotifications, statusConnection, emailNotifications, isHighlighted, isMentioned }) {

	// no user or room preference
	if (emailNotifications == null) {

		if (disableAllMessageNotifications) {
			return false;
		}

		// default server preference is disabled
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_emailNotificationMode') === 'disabled') {
			return false;
		}
	}

	// user/room preference to nothing
	if (emailNotifications === 'nothing') {
		return false;
	}

	// use connected (don't need to send him an email)
	if (statusConnection === 'online') {
		return false;
	}

	return isHighlighted || emailNotifications === 'all' || isMentioned;
}
