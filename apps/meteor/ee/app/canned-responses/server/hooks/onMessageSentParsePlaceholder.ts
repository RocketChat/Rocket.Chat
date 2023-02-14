import get from 'lodash.get';
import type { IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { Users, Rooms } from '../../../../../app/models/server';

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

const handleBeforeSaveMessage = (message: IMessage, room?: IOmnichannelRoom): IMessage => {
	if (!message.msg || message.msg === '') {
		return message;
	}

	room = room?._id ? room : Rooms.findOneById(message.rid);
	if (!room || !isOmnichannelRoom(room)) {
		return message;
	}

	let messageText = message.msg;
	const agentId = room?.servedBy?._id;
	const visitorId = room?.v?._id;
	const agent = Users.findOneById(agentId, { fields: { name: 1, _id: 1, emails: 1 } }) || {};
	const visitor = visitorId && (Promise.await(LivechatVisitors.findOneById(visitorId, {})) || {});

	Object.keys(placeholderFields).map((field) => {
		const templateKey = `{{${field}}}`;
		const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];
		const from = placeholderConfig.from === 'agent' ? agent : visitor;
		const data = get(from, placeholderConfig.dataKey, '');
		messageText = replaceAll(messageText, templateKey, data);

		return messageText;
	});

	message.msg = messageText;
	return message;
};

settings.watch('Canned_Responses_Enable', function (value) {
	if (!value) {
		callbacks.remove('beforeSaveMessage', 'canned-responses-replace-placeholders');
		return;
	}

	callbacks.add('beforeSaveMessage', handleBeforeSaveMessage, callbacks.priority.HIGH * 2, 'canned-responses-replace-placeholders');
});
