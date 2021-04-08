import * as Models from '../../../models/server';
import { logger } from '../logger';
import { getRoomByNameOrIdWithOptionToJoin, processWebhookMessage } from '../../../lib/server';

interface IMessageValues {
	channel: string;
	alias: string;
	avatar: string;
	emoji: string;
}

class SendMessageWebhook {
	// Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.
	sendMessage({ trigger, nameOrId = '', room, message, data }: { trigger: any; nameOrId: string; room: any; message: any; data: any }): any {
		let user;
		// Try to find the user who we are impersonating
		if (trigger.impersonateUser) {
			user = Models.Users.findOneByUsernameIgnoringCase(data.user_name);
		}

		// If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
		// configured username for the integration since this is required at all times.
		if (!user) {
			user = Models.Users.findOneByUsernameIgnoringCase(trigger.username);
		}

		let tmpRoom;
		if (nameOrId || trigger.targetRoom || message.channel) {
			tmpRoom = getRoomByNameOrIdWithOptionToJoin({ currentUserId: user._id, nameOrId: nameOrId || message.channel || trigger.targetRoom, errorOnEmpty: false }) || room;
		} else {
			tmpRoom = room;
		}

		// If no room could be found, we won't be sending any messages but we'll warn in the logs
		if (!tmpRoom) {
			logger.outgoing.warn(`The Integration "${ trigger.name }" doesn't have a room configured nor did it provide a room to send the message to.`);
			return;
		}

		logger.outgoing.debug(`Found a room for ${ trigger.name } which is: ${ tmpRoom.name } with a type of ${ tmpRoom.t }`);

		message.bot = { i: trigger._id };

		const defaultValues: IMessageValues = {
			channel: '',
			alias: trigger.alias,
			avatar: trigger.avatar,
			emoji: trigger.emoji,
		};

		if (tmpRoom.t === 'd') {
			message.channel = `@${ tmpRoom._id }`;
		} else {
			message.channel = `#${ tmpRoom._id }`;
		}

		message = processWebhookMessage(message, user, defaultValues, trigger);
		return message;
	}
}

export default new SendMessageWebhook();
