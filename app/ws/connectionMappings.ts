import redis from '../redis/redis';
import { acquireLock, acquireLocks, lockUser } from './channelLocks';

const channelListeners: Map<string, Set<string>> = new Map();
const connectionToChannels: Map<string, Set<string>> = new Map();
const userConnections: Map<string, Set<string>> = new Map();

const updateMappingsOnSub = (connectionId: string, channels: Set<string>, userId: string): void => {
	userConnections.set(userId, (userConnections.get(userId) || new Set()).add(connectionId));

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
		if (channelListeners.get(channel)?.size === 1) {
			redis.subscribe(channel);
		}
		release();
	});
};

const decreaseConnectionIdFromChannelBindCount = async (channel: string, connectionId: string): Promise<void> => {
	const release = await acquireLock(channel);
	try {
		const listeningConnections = channelListeners.get(channel);
		console.log('listeners ', listeningConnections, channel, connectionId);
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
};

const removeConnectionIdBinding = (connectionId: string): void => {
	const connectionChannels = connectionToChannels.get(connectionId);
	console.log('connectionChannels: ', connectionChannels);
	connectionChannels?.forEach(async (channel: string) => {
		decreaseConnectionIdFromChannelBindCount(channel, connectionId);
	});
};

const decreaseChannelListenerCountOnUser = async (channel: string, userId: string): Promise<void> => {
	const releases = await acquireLocks([`user-${ userId }`, channel]);
	try {
		const userConnectionsSet = userConnections.get(userId);
		userConnectionsSet?.forEach((connectionId: string) => {
			decreaseConnectionIdFromChannelBindCount(channel, connectionId);
		});
	} finally {
		Promise.all(releases.map((release) => release()));
	}
};

const removeConnectionId = async (connectionId: string, userId: string): Promise<void> => {
	const release = await lockUser(userId);
	try {
		removeConnectionIdBinding(connectionId);
		userConnections.get(userId)?.delete(connectionId);
		if (userConnections.get(userId)?.size === 0) {
			userConnections.delete(userId);
		}

		connectionToChannels.delete(connectionId); // TODO-Hi: Maybe had debounce/something to handle user refreshes
	} finally {
		release();
	}
};

const addChannelOnCreate = async (channel: string, userId: string): Promise<void> => {
	const releases = await acquireLocks([`user-${ userId }`, channel]);
	try {
		const userConnectionsSet = userConnections.get(userId);
		userConnectionsSet?.forEach((connectionId: string) => {
			const boundChannels = connectionToChannels.get(connectionId) as Set<string>;
			boundChannels.add(channel);

			channelListeners.set(channel, (channelListeners.get(channel) || new Set()).add(connectionId));
			if (channelListeners.get(channel)?.size === 1) {
				redis.subscribe(channel);
			}
		});
	} finally {
		Promise.all(releases.map((release) => release()));
	}
};

setInterval(() => {
	console.log('channelListeners: ', channelListeners);
	console.log('connectionToChannels: ', connectionToChannels);
	console.log('userConnections: ', userConnections);
}, 5000);

export { addChannelOnCreate, decreaseChannelListenerCountOnUser, removeConnectionId, updateMappingsOnSub };
