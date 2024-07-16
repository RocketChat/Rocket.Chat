import { Message } from '@rocket.chat/core-services';
import type { IUser, MessageTypesValues, IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms, LivechatVisitors, Messages, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import moment from 'moment-timezone';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { getTimezone } from '../../../utils/server/lib/getTimezone';

const logger = new Logger('Livechat-SendTranscript');

export async function sendTranscript({
	token,
	rid,
	email,
	subject,
	user,
}: {
	token: string;
	rid: string;
	email: string;
	subject?: string;
	user?: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset'> | null;
}): Promise<boolean> {
	check(rid, String);
	check(email, String);
	logger.debug(`Sending conversation transcript of room ${rid} to user with token ${token}`);

	const room = await LivechatRooms.findOneById(rid);

	const visitor = await LivechatVisitors.getVisitorByToken(token, {
		projection: { _id: 1, token: 1, language: 1, username: 1, name: 1 },
	});

	if (!visitor) {
		throw new Error('error-invalid-token');
	}

	// @ts-expect-error - Visitor typings should include language?
	const userLanguage = visitor?.language || settings.get('Language') || 'en';
	const timezone = getTimezone(user);
	logger.debug(`Transcript will be sent using ${timezone} as timezone`);

	if (!room) {
		throw new Error('error-invalid-room');
	}

	// allow to only user to send transcripts from their own chats
	if (room.t !== 'l' || !room.v || room.v.token !== token) {
		throw new Error('error-invalid-room');
	}

	const showAgentInfo = settings.get<boolean>('Livechat_show_agent_info');
	const closingMessage = await Messages.findLivechatClosingMessage(rid, { projection: { ts: 1 } });
	const ignoredMessageTypes: MessageTypesValues[] = [
		'livechat_navigation_history',
		'livechat_transcript_history',
		'command',
		'livechat-close',
		'livechat-started',
		'livechat_video_call',
	];
	const messages = await Messages.findVisibleByRoomIdNotContainingTypesBeforeTs(
		rid,
		ignoredMessageTypes,
		closingMessage?.ts ? new Date(closingMessage.ts) : new Date(),
		{
			sort: { ts: 1 },
		},
	);

	let html = '<div> <hr>';
	await messages.forEach((message) => {
		let author;
		if (message.u._id === visitor._id) {
			author = i18n.t('You', { lng: userLanguage });
		} else {
			author = showAgentInfo ? message.u.name || message.u.username : i18n.t('Agent', { lng: userLanguage });
		}

		const datetime = moment.tz(message.ts, timezone).locale(userLanguage).format('LLL');
		const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
		html += singleMessage;
	});

	html = `${html}</div>`;

	const fromEmail = settings.get<string>('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);
	let emailFromRegexp = '';
	if (fromEmail) {
		emailFromRegexp = fromEmail[0];
	} else {
		emailFromRegexp = settings.get<string>('From_Email');
	}

	// Some endpoints allow the caller to pass a different `subject` via parameter.
	// IF subject is passed, we'll use that one and treat it as an override
	// IF no subject is passed, we fallback to the setting `Livechat_transcript_email_subject`
	// IF that is not configured, we fallback to 'Transcript of your livechat conversation', which is the default value
	// As subject and setting value are user input, we don't translate them
	const mailSubject =
		subject ||
		settings.get<string>('Livechat_transcript_email_subject') ||
		i18n.t('Transcript_of_your_livechat_conversation', { lng: userLanguage });

	await Mailer.send({
		to: email,
		from: emailFromRegexp,
		replyTo: emailFromRegexp,
		subject: mailSubject,
		html,
	});

	setImmediate(() => {
		void callbacks.run('livechat.sendTranscript', messages, email);
	});

	const requestData: IOmnichannelSystemMessage['requestData'] = {
		type: 'user',
		visitor,
		user,
	};

	if (!user?.username) {
		const cat = await Users.findOneById('rocket.cat', { projection: { _id: 1, username: 1, name: 1 } });
		if (cat) {
			requestData.user = cat;
			requestData.type = 'visitor';
		}
	}

	if (!requestData.user) {
		logger.error('rocket.cat user not found');
		throw new Error('No user provided and rocket.cat not found');
	}

	await Message.saveSystemMessage<IOmnichannelSystemMessage>('livechat_transcript_history', room._id, '', requestData.user, {
		requestData,
	});

	return true;
}
