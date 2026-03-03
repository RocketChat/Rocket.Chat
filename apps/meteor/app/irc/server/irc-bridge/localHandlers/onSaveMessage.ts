import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

import { SystemLogger } from '../../../../../server/lib/logger/system';

export default async function handleOnSaveMessage(this: any, message: IMessage, to: IRoom): Promise<void> {
	let toIdentification = '';
	// Direct message
	if (to.t === 'd') {
		const subscriptions = await Subscriptions.findByRoomId(to._id).toArray();
		for await (const subscription of subscriptions) {
			if (subscription.u._id !== message.u._id) {
				const userData = await Users.findOne({ username: subscription.u.username });
				if (userData) {
					if ((userData as any).profile && (userData as any).profile.irc && (userData as any).profile.irc.nick) {
						toIdentification = (userData as any).profile.irc.nick;
					} else {
						toIdentification = userData.username as string;
					}
				} else {
					toIdentification = subscription.u.username as string;
				}
			}
		}

		if (!toIdentification) {
			SystemLogger.error('[irc][server] Target user not found');
			return;
		}
	} else {
		toIdentification = `#${to.name}`;
	}

	const user = await Users.findOne({ _id: message.u._id });

	this.sendCommand('sentMessage', { to: toIdentification, user, message: message.msg });
}
