import { isILivechatVisitor, isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import get from 'lodash.get';
import mem from 'mem';

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

		message.msg = await Object.keys(placeholderFields).reduce(async (messageText, field) => {
			const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];

			const from = placeholderConfig.from === 'agent' ? await getAgent(agentId) : await this.getVisitor(room.v._id);

			const data = get(from, placeholderConfig.dataKey, '');

			return (await messageText).replace(new RegExp(`{{${field}}}`, 'g'), data);
		}, Promise.resolve(message.msg));

		return message;
	}
}
