import { Mutex } from 'async-mutex';

import { Subscriptions } from '../models/server';
import redis from '../redis/redis';

const channelListeners: Map<string, Set<string>> = new Map();
const connectionToChannels: Map<string, Set<string>> = new Map();
const userConnections: Map<string, Set<string>> = new Map();

// TODO-Hi: Add a map to store user to connectionId mapping
const locks = new Map<string, Mutex>();

async function acquireLock(key: string): Promise<() => void> { // TODO-Hi: Move to a separate file
	if (!locks.has(key)) {
		locks.set(key, new Mutex());
	}

	const mutex = locks.get(key) as Mutex;

	const release = await mutex.acquire(); 	// Acquire the lock and return the release function
	return release;
}


const addToMap = (connectionId: string, channels: Set<string>): void => {
	const connectionChannels = connectionToChannels.get(connectionId);
	if (!connectionChannels) {
		connectionToChannels.set(connectionId, channels);
	} else {
		channels.forEach((channel: string) => {
			connectionChannels.add(channel);
		});
		connectionToChannels.set(connectionId, connectionChannels);
	}

	channels.forEach(async (channel: string) => {
		const release = await acquireLock(channel);
		channelListeners.set(channel, (channelListeners.get(channel) || new Set()).add(connectionId));
		release();
	});
};

const updateConnectionChannels = (connectionId: string): void => {
	const connectionChannels = connectionToChannels.get(connectionId);
	console.log('connectionChannels: ', connectionChannels);
	connectionChannels?.forEach(async (channel: string) => {
		const release = await acquireLock(channel);
		try {
			const listeningConnections = channelListeners.get(channel);
			console.log('listeners ', listeningConnections);
			if (listeningConnections?.size === 1) {
				console.log(`Unsubscribing to channel: ${ channel }`);
				channelListeners.delete(channel);
				redis.unsubscribe(channel);
			} else {
				listeningConnections?.delete(connectionId);
			}
		} finally {
			release();
		}
	});
};

const subscribe = (userId: string, connectionId: string): void => {
	console.log('Subscribing to ', userId);

	const channels: Set<string> = new Set(Subscriptions.findByUserId(userId, { rid: 1 }).map(({ rid }: { rid: string }) => `room-${ rid }`));
	channels.add(`user-${ userId }`);
	channels.add('all');

	userConnections.set(userId, (userConnections.get(userId) || new Set()).add(connectionId));
	channels.forEach((channel: string) => {
		console.log('SUBSCRIBING TO ', channel);
		redis.subscribe(channel); // TODO-Hi: What to do if the subsribe fails
	});
	addToMap(connectionId, channels);
};

setInterval(() => {
	console.log(channelListeners);
	console.log(connectionToChannels);
	console.log(userConnections);
}, 5000);

const unsubscribe = (userId: string, connectionId: string): void => {
	console.log(`Unsubscribing connectionId: ${ connectionId }, userId: ${ userId }`);
	updateConnectionChannels(connectionId);
	userConnections.get(userId)?.delete(connectionId);
	connectionToChannels.delete(connectionId); // TODO-Hi: Maybe had debounce/something to handle user refreshes
};
// TODO-Hi: Add isalive
// TODO-Hi: Check in carosulle
// TODO-Hi: Check race-condition on critical sections
// TODO-Hi: Check with or if we should find the object in message subscriptions
const ChannelHandler = { subscribe, unsubscribe };

export default ChannelHandler;
