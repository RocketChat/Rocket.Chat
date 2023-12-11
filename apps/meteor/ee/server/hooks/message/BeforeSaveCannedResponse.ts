import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import get from 'lodash.get';

import { settings } from '../../../../app/settings/server';

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

export class BeforeSaveCannedResponse {
	static enabled = false;

	constructor() {
		void License.onToggledFeature('canned-responses', {
			up: () => {
				BeforeSaveCannedResponse.enabled = true;
			},
			down: () => {
				BeforeSaveCannedResponse.enabled = false;
			},
		});
	}

	async replacePlaceholders({ message, room }: { message: IMessage; room: IRoom }): Promise<IMessage> {
		// If the feature is disabled, return the message as is
		if (!BeforeSaveCannedResponse.enabled) {
			return message;
		}

		if (!settings.get('Canned_Responses_Enable')) {
			return message;
		}

		if (!message.msg || message.msg === '') {
			return message;
		}

		if (!isOmnichannelRoom(room)) {
			return message;
		}

		const agentId = room?.servedBy?._id;
		if (!agentId) {
			return message;
		}

		const visitorId = room.v._id;

		const agent = (await Users.findOneById(agentId, { projection: { name: 1, _id: 1, emails: 1 } })) || {};
		const visitor = visitorId && ((await LivechatVisitors.findOneEnabledById(visitorId, {})) || {});

		message.msg = Object.keys(placeholderFields).reduce((messageText, field) => {
			const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];
			const from = placeholderConfig.from === 'agent' ? agent : visitor;
			const data = get(from, placeholderConfig.dataKey, '');

			return messageText.replace(new RegExp(`{{${field}}}`, 'g'), data);
		}, message.msg);

		return message;
	}
}
