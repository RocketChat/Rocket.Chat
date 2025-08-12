import { Subscriptions, Users } from '@rocket.chat/models';

import { SystemLogger } from '../../../../../server/lib/logger/system';

export default async function handleOnSaveMessage(message, to) {
	let toIdentification = '';
	// Direct message
	if (to.t === 'd') {
		const subscriptions = Subscriptions.findByRoomId(to._id).toArray();
		for await (const subscription of subscriptions) {
			if (subscription.u._id !== message.u._id) {
				const userData = await Users.findOne({ username: subscription.u.username });
				if (userData) {
					if (userData.profile && userData.profile.irc && userData.profile.irc.nick) {
						toIdentification = userData.profile.irc.nick;
					} else {
						toIdentification = userData.username;
					}
				} else {
					toIdentification = subscription.u.username;
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
