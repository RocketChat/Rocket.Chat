import redis from '../redis/redis';
import { acquireLock } from './channelLocks';

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
		release();
	});
};

const decreaseChannelsBinding = (connectionId: string): void => {
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

const removeConnectionId = (connectionId: string, userId: string): void => {
	decreaseChannelsBinding(connectionId);
	userConnections.get(userId)?.delete(connectionId);
	connectionToChannels.delete(connectionId); // TODO-Hi: Maybe had debounce/something to handle user refreshes
};

setInterval(() => {
	console.log(channelListeners);
	console.log(connectionToChannels);
	console.log(userConnections);
}, 5000);

export { removeConnectionId, updateMappingsOnSub, userConnections };
