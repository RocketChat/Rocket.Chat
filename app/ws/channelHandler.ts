import { Mutex } from 'async-mutex';

import { Subscriptions } from '../models/server';
import redis from '../redis/redis';

const channelListeners: Map<string, number> = new Map();
const connectionToChannels: Map<string, string[]> = new Map(); // TODO-Hi: Change to a Set and check if the complexity if fine
const locks = new Map<string, Mutex>();

async function acquireLock(key: string): Promise<() => void> {
	if (!locks.has(key)) {
		locks.set(key, new Mutex());
	}

	const mutex = locks.get(key) as Mutex;

	const release = await mutex.acquire(); 	// Acquire the lock and return the release function
	return release;
}


const addToMap = (connectionId: string, channels: string[]): void => {
	connectionToChannels.set(connectionId, (connectionToChannels.get(connectionId) || []).concat(channels));
	channels.forEach(async (channel: string) => {
		const release = await acquireLock(channel);
		channelListeners.set(channel, (channelListeners.get(channel) || 0) + 1);
		release();
	});
};

const updateConnectionChannels = (connectionId: string): void => {
	const connectionChannels = connectionToChannels.get(connectionId);
	console.log('connectionChannels: ', connectionChannels);
	connectionChannels?.forEach(async (channel: string) => {
		const release = await acquireLock(channel);
		try {
			const listeners = channelListeners.get(channel) as number;
			console.log('listeners ', listeners);
			if (listeners === 1) {
				console.log(`Unsubscribing to channel: ${ channel }`);
				channelListeners.delete(channel);
				redis.unsubscribe(channel);
			} else {
				channelListeners.set(channel, listeners - 1);
			}
		} finally {
			release();
		}
	});
};

const subscribe = (userId: string, connectionId: string): void => {
	console.log('Subscribing to ', userId);
	const channels = Subscriptions.findByUserId(userId, { rid: 1 }).map(({ rid }: { rid: string }) => `room-${ rid }`);
	channels.push(`user-${ userId }`);

	channels.forEach((channel: string) => {
		console.log('SUBSCRIBING TO ', channel);
		redis.subscribe(channel); // TODO-Hi: What to do if the subsribe fails
	});
	addToMap(connectionId, channels);

	// TODO: subscribe to all channels
};

setInterval(() => {
	console.log(channelListeners);
	console.log(connectionToChannels);
}, 5000);

const unsubscribe = (userId: string, connectionId: string): void => {
	console.log(`Unsubscribing connectionId: ${ connectionId }, userId: ${ userId }`);
	updateConnectionChannels(connectionId);
	connectionToChannels.delete(connectionId); // TODO-Hi: Maybe had debounce/something to handle user refreshes
};
// TODO-Hi: Add isalive
// TODO-Hi: Check in carosulle

const ChannelHandler = { subscribe, unsubscribe };

export default ChannelHandler;
