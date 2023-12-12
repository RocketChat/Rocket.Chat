import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isILivechatVisitor, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import get from 'lodash.get';
import mem from 'mem';

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
		if (!settings.get('Canned_Responses_Enable')) {
			BeforeSaveCannedResponse.enabled = true;
		}
		void License.onToggledFeature('canned-responses', {
			up: () => {
				BeforeSaveCannedResponse.enabled = true;
			},
			down: () => {
				BeforeSaveCannedResponse.enabled = false;
			},
		});
	}

	private getUser = mem((userId: string) => Users.findOneById(userId, { projection: { name: 1, _id: 1, emails: 1 } }), {
		maxAge: 1000 * 30,
	});

	private getVisitor = mem((visitorId: string) => LivechatVisitors.findOneEnabledById(visitorId), {
		maxAge: 1000 * 30,
	});

	async replacePlaceholders({
		message,
		room,
		user,
	}: {
		message: IMessage;
		room: IRoom;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'emails' | 'language'>;
	}): Promise<IMessage> {
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

		// do not replace placeholders for visitors
		if (!user || isILivechatVisitor(user)) {
			return message;
		}

		const agentId = room?.servedBy?._id;
		if (!agentId) {
			return message;
		}

		const getAgent = (agentId: string) => {
			if (agentId === user._id) {
				return user;
			}

			return this.getUser(agentId);
		};

		message.msg = Object.keys(placeholderFields).reduce((messageText, field) => {
			const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];

			const from = placeholderConfig.from === 'agent' ? getAgent(agentId) : this.getVisitor(room.v._id);

			const data = get(from, placeholderConfig.dataKey, '');

			return messageText.replace(new RegExp(`{{${field}}}`, 'g'), data);
		}, message.msg);

		return message;
	}
}
