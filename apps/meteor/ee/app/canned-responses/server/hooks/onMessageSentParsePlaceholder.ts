import get from 'lodash.get';
import type { IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users, LivechatRooms } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

const placeholderFields = {
	'contact.name': {
		from: 'visitor',
		dataKey: 'name',
	},
	'contact.email': {
		from: 'visitor',
		dataKey: 'visitorEmails[0].address',
	},
	'contact.phone': {
		from: 'visitor',
		dataKey: 'phone[0].phoneNumber',
	},
	'agent.name': {
		from: 'agent',
		dataKey: 'name',
	},
	'agent.email': {
		from: 'agent',
		dataKey: 'emails[0].address',
	},
};

const replaceAll = (text: string, old: string, replace: string): string => text.replace(new RegExp(old, 'g'), replace);

type PartialParsedMdItem =
	| {
			type: string;
			value: PartialParsedMdItem[];
	  }
	| { type: 'PLAIN_TEXT'; value: string };

const isPlainText = (messageMd: PartialParsedMdItem): messageMd is { type: 'PLAIN_TEXT'; value: string } => {
	return messageMd.type === 'PLAIN_TEXT';
};

const replaceInMdArray = (messageMd: PartialParsedMdItem[], templateKey: string, data: string): PartialParsedMdItem[] => {
	return messageMd.map((item) => {
		if (isPlainText(item)) {
			return {
				type: 'PLAIN_TEXT',
				value: replaceAll(item.value, templateKey, data),
			};
		}

		if (item.type !== 'PLAIN_TEXT' && !Array.isArray(item.value)) {
			return item;
		}

		return {
			type: item.type,
			value: replaceInMdArray(item.value, templateKey, data),
		};
	});
};

const handleBeforeSaveMessage = async (message: IMessage, room?: IOmnichannelRoom): Promise<IMessage> => {
	if (!message.msg || message.msg === '') {
		return message;
	}

	room = room?._id ? room : ((await LivechatRooms.findOneById(message.rid)) as IOmnichannelRoom);
	if (!room || !isOmnichannelRoom(room)) {
		return message;
	}

	let messageText = message.msg;
	let messageMd = message.md;
	const agentId = room?.servedBy?._id;
	const visitorId = room?.v?._id;

	const agent = (agentId && (await Users.findOneById(agentId, { projection: { name: 1, _id: 1, emails: 1 } }))) || {};
	const visitor = visitorId && ((await LivechatVisitors.findOneById(visitorId, {})) || {});

	Object.keys(placeholderFields).map((field) => {
		const templateKey = `{{${field}}}`;
		const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];
		const from = placeholderConfig.from === 'agent' ? agent : visitor;
		const data = get(from, placeholderConfig.dataKey, '');
		messageText = replaceAll(messageText, templateKey, data);
		messageMd = messageMd ? (replaceInMdArray(messageMd as PartialParsedMdItem[], templateKey, data) as IMessage['md']) : undefined;

		return messageText;
	});

	message.msg = messageText;
	message.md = messageMd;
	return message;
};

settings.watch<boolean>('Canned_Responses_Enable', function (value) {
	if (!value) {
		callbacks.remove('beforeSaveMessage', 'canned-responses-replace-placeholders');
		return;
	}

	callbacks.add(
		'beforeSaveMessage',
		(message: IMessage, room?: IOmnichannelRoom): IMessage => Promise.await(handleBeforeSaveMessage(message, room)),
		callbacks.priority.MEDIUM,
		'canned-responses-replace-placeholders',
	);
});
