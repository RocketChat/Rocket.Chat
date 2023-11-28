import type { IMessage, SettingValue, IUser } from '@rocket.chat/core-typings';
import { Messages, Settings, Users } from '@rocket.chat/models';
import mem from 'mem';

const getSettingCached = mem(async (setting: string): Promise<SettingValue> => Settings.getValueById(setting), { maxAge: 10000 });

const getUserNameCached = mem(
	async (userId: string): Promise<string | undefined> => {
		const user = await Users.findOne<Pick<IUser, 'name'>>(userId, { projection: { name: 1 } });
		return user?.name;
	},
	{ maxAge: 10000 },
);

export const broadcastMessageSentEvent = async ({
	id,
	data,
	broadcastCallback,
}: {
	id: IMessage['_id'];
	broadcastCallback: (message: IMessage) => Promise<void>;
	data?: IMessage;
}): Promise<void> => {
	const message = data ?? (await Messages.findOneById(id));
	if (!message) {
		return;
	}

	if (message._hidden !== true && message.imported == null) {
		const UseRealName = (await getSettingCached('UI_Use_Real_Name')) === true;

		if (UseRealName) {
			if (message.u?._id) {
				const name = await getUserNameCached(message.u._id);
				if (name) {
					message.u.name = name;
				}
			}

			if (message.mentions?.length) {
				for await (const mention of message.mentions) {
					const name = await getUserNameCached(mention._id);
					if (name) {
						mention.name = name;
					}
				}
			}
		}

		void broadcastCallback(message);
	}
};
