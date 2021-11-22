import { SystemLogger } from './logger/system';
import { Roles, Users } from '../../app/models/server/raw';
import { executeSendMessage } from '../../app/lib/server/methods/sendMessage';
import { createDirectMessage } from '../methods/createDirectMessage';
import { IUser } from '../../definition/IUser';

const getData = (param: any[] | Function, adminUser: IUser): any[] => {
	let result = param;

	if (typeof param === 'function') {
		result = param({ adminUser });
	}

	if (!Array.isArray(result)) {
		return [result];
	}

	return result;
}

export async function sendMessagesToAdmins({
	fromId = 'rocket.cat',
	checkFrom = true,
	msgs = [],
	banners = [],
}: {
	fromId?: string;
	checkFrom?: boolean;
	msgs?: any[] | Function;
	banners?: any[] | Function;
}): Promise<void> {
	const fromUser = checkFrom ? await Users.findOneById(fromId, { projection: { _id: 1 } }) : true;

	const users = await (await Roles.findUsersInRole('admin')).toArray();

	for await (const adminUser of users) {
		if (fromUser) {
			try {
				const { rid } = createDirectMessage([adminUser.username], fromId);

				getData(msgs, adminUser)
					.forEach((msg) => executeSendMessage(fromId, Object.assign({ rid }, msg)));
			} catch (error) {
				SystemLogger.error(error);
			}
		}

		await Promise.all(getData(banners, adminUser).map((banner) => Users.addBannerById(adminUser._id, banner)));
	}
}
