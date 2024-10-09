import type { IUser, IMessage } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';

import { notifyOnUserChangeAsync } from '../../app/lib/server/lib/notifyListener';
import { executeSendMessage } from '../../app/lib/server/methods/sendMessage';
import { createDirectMessage } from '../methods/createDirectMessage';
import { SystemLogger } from './logger/system';

type Banner = {
	id: string;
	priority: number;
	title: string;
	text: string;
	textArguments?: string[];
	modifiers: string[];
	link: string;
};

const getData = async <T>(param: T[] | ((params: { adminUser: IUser }) => Promise<T[] | T>), adminUser: IUser): Promise<T[]> => {
	const result = typeof param === 'function' ? await param({ adminUser }) : param;

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
	msgs?: Partial<IMessage>[] | ((params: { adminUser: IUser }) => Promise<Partial<IMessage>[] | Partial<IMessage>>);
	banners?: Banner[] | ((params: { adminUser: IUser }) => Promise<Banner[]>);
}): Promise<void> {
	const fromUser = checkFrom ? await Users.findOneById(fromId, { projection: { _id: 1 } }) : true;

	const users = await (await Roles.findUsersInRole('admin')).toArray();

	const notifyAdmins: string[] = [];

	for await (const adminUser of users) {
		if (fromUser) {
			try {
				const { rid } = await createDirectMessage([adminUser.username], fromId);

				await Promise.all(
					(await getData<Partial<IMessage>>(msgs, adminUser)).map((msg) => executeSendMessage(fromId, Object.assign({ rid }, msg))),
				);
			} catch (error) {
				SystemLogger.error(error);
			}
		}

		const updates = await Promise.all(
			(await getData<Banner>(banners, adminUser)).map((banner) => Users.addBannerById(adminUser._id, banner)),
		);

		const hasUpdated = updates.some(({ modifiedCount }) => modifiedCount > 0);
		if (hasUpdated) {
			notifyAdmins.push(adminUser._id);
		}
	}

	if (notifyAdmins.length === 0) {
		return;
	}

	void notifyOnUserChangeAsync(async () => {
		const results = await Users.findByIds<Pick<IUser, '_id' | 'banners'>>(notifyAdmins, { projection: { banners: 1 } }).toArray();

		return results.map(({ _id, banners }) => ({
			id: _id,
			clientAction: 'updated',
			diff: {
				banners,
			},
		}));
	});
}
