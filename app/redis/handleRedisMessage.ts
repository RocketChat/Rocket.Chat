import superjson from 'superjson';

import { Notifications } from '../notifications/server';
import redis from './redis';

interface IRedisHandlers {
	rocketchat_message: Function;
	rocketchat_subscription: Function;
	rocketchat_room: Function;
	rocketchat_settings: Function;
	users: Function;
}

type IRedisMsg = {
	ns: keyof IRedisHandlers;
	broadcast?: boolean;
}

type IBroadcastMsg = {
	key: string;
	eventName: string;
	funcName: string;
	data: any;
	broadcast?: boolean;
};

const parseRedisMessage = (msg: string) => {
	if (msg.startsWith('{"json":')) {
	  return superjson.parse(msg);
	}
	  return JSON.parse(msg);
};


export const redisMessageHandlers: Partial<IRedisHandlers> = {};


redis.on('message', (channel: string, msg: string) => {
	console.log('new message from redis');

	const message = parseRedisMessage(msg) as IBroadcastMsg | IRedisMsg;

	if (message.ns === 'broadcast') {
		const data = message as IBroadcastMsg;
		Notifications.pubsubAdapter(data.key, data.eventName, data.funcName, data.data);
	} else {
		const { ns } = message as IRedisMsg;
		const handler = redisMessageHandlers[ns];
		if (handler) {
			return handler(message);
		}
	}
});
