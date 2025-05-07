import superjson from 'superjson';

import redis from './redis';

interface IRedisHandlers {
	rocketchat_message: Function;
	rocketchat_subscription: Function;
	rocketchat_room: Function;
	rocketchat_settings: Function;
	users: Function;
}

const parseRedisMessage = (msg: string) => {
	if (msg.startsWith('{"json":')) {
	  return superjson.parse(msg);
	} else {
	  return JSON.parse(msg);
	}
  };
  

export const redisMessageHandlers: Partial<IRedisHandlers> = {};


redis.on('message', (channel: string, msg: string) => {
	console.log('new message from redis');

	const message = parseRedisMessage(msg) 
	const { ns } = message as { ns: keyof IRedisHandlers};
	const handler = redisMessageHandlers[ns];

	if (handler) {
		return handler(message);
	}
});
