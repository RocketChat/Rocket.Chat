import type { IUser, IMessage } from '@rocket.chat/core-typings';

import { SystemLogger } from './logger/system';
import { Roles, Users } from '../../app/models/server/raw';
import { executeSendMessage } from '../../app/lib/server/methods/sendMessage';
import { createDirectMessage } from '../methods/createDirectMessage';

type Banner = {
	id: string;
	priority: number;
	title: string;
	text: string;
	textArguments?: string[];
	modifiers: string[];
	link: string;
};

const getData = <T>(param: T[] | Function, adminUser: IUser): T[] => {
	const result = typeof param === 'function' ? param({ adminUser }) : param;

	if (!Array.isArray(result)) {
		return [result];
	}

	return result;
};

export async function sendMessagesToAdmins({
	fromId = 'rocket.cat',
	checkFrom = true,
	msgs = [],
	banners = [],
}: {
	fromId?: string;
	checkFrom?: boolean;
	msgs?: Partial<IMessage>[] | Function;
	banners?: Banner[] | Function;
}): Promise<void> {
	const fromUser = checkFrom ? await Users.findOneById(fromId, { projection: { _id: 1 } }) : true;

	const users = await (await Roles.findUsersInRole('admin')).toArray();

	for await (const adminUser of users) {
		if (fromUser) {
			try {
				const { rid } = createDirectMessage([adminUser.username], fromId);

				getData<Partial<IMessage>>(msgs, adminUser).forEach((msg) => executeSendMessage(fromId, Object.assign({ rid }, msg)));
			} catch (error) {
				SystemLogger.error(error);
			}
		}

		await Promise.all(getData<Banner>(banners, adminUser).map((banner) => Users.addBannerById(adminUser._id, banner)));
	}
}
