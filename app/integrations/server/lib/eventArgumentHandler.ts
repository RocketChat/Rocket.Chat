/* eslint-disable @typescript-eslint/camelcase */
import { logger } from '../logger';
import { settings } from '../../../settings/server';


interface IKeyable {
	[key: string]: any;
}

class EventArgumentHandler {
	eventNameArgumentsToObject(...args: any): IKeyable {
		const argObject: IKeyable = {
			event: args[0],
		};

		switch (argObject.event) {
			case 'sendMessage':
				if (args.length >= 3) {
					argObject.message = args[1];
					argObject.room = args[2];
				}
				break;
			case 'fileUploaded':
				if (args.length >= 2) {
					const arghhh = args[1];
					argObject.user = arghhh.user;
					argObject.room = arghhh.room;
					argObject.message = arghhh.message;
				}
				break;
			case 'roomArchived':
				if (args.length >= 3) {
					argObject.room = args[1];
					argObject.user = args[2];
				}
				break;
			case 'roomCreated':
				if (args.length >= 3) {
					argObject.owner = args[1];
					argObject.room = args[2];
				}
				break;
			case 'roomJoined':
			case 'roomLeft':
				if (args.length >= 3) {
					argObject.user = args[1];
					argObject.room = args[2];
				}
				break;
			case 'userCreated':
				if (args.length >= 2) {
					argObject.user = args[1];
				}
				break;
			default:
				logger.outgoing.warn(`An Unhandled Trigger Event was called: ${ argObject.event }`);
				argObject.event = undefined;
				break;
		}

		logger.outgoing.debug(`Got the event arguments for the event: ${ argObject.event }`, argObject);

		return argObject;
	}

	mapEventArgsToData(data: any, { event, message, room, owner, user }: { event: any; message: any; room: any; owner: any; user: any}): void {
		switch (event) {
			case 'sendMessage':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.message_id = message._id;
				data.timestamp = message.ts;
				data.user_id = message.u._id;
				data.user_name = message.u.username;
				data.text = message.msg;
				data.siteUrl = settings.get('Site_Url');

				if (message.alias) {
					data.alias = message.alias;
				}

				if (message.bot) {
					data.bot = message.bot;
				}

				if (message.editedAt) {
					data.isEdited = true;
				}

				if (message.tmid) {
					data.tmid = message.tmid;
				}
				break;
			case 'fileUploaded':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.message_id = message._id;
				data.timestamp = message.ts;
				data.user_id = message.u._id;
				data.user_name = message.u.username;
				data.text = message.msg;
				data.user = user;
				data.room = room;
				data.message = message;

				if (message.alias) {
					data.alias = message.alias;
				}

				if (message.bot) {
					data.bot = message.bot;
				}
				break;
			case 'roomCreated':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.timestamp = room.ts;
				data.user_id = owner._id;
				data.user_name = owner.username;
				data.owner = owner;
				data.room = room;
				break;
			case 'roomArchived':
			case 'roomJoined':
			case 'roomLeft':
				data.timestamp = new Date();
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.user_id = user._id;
				data.user_name = user.username;
				data.user = user;
				data.room = room;

				if (user.type === 'bot') {
					data.bot = true;
				}
				break;
			case 'userCreated':
				data.timestamp = user.createdAt;
				data.user_id = user._id;
				data.user_name = user.username;
				data.user = user;

				if (user.type === 'bot') {
					data.bot = true;
				}
				break;
			default:
				break;
		}
	}
}

export default new EventArgumentHandler();
