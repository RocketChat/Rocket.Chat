import redis from '../redis/redis';
import { acquireLock } from './channelLocks';

type ConnectionId = string;
type ChannelName = string;
type UserId = string;

const channelListeners: Map<ChannelName, Set<ConnectionId>> = new Map(); // the most important one, which declares if a redis channel should be subscribed or not
const connectionToChannels: Map<ConnectionId, Set<ChannelName>> = new Map(); // for supporting updating due to client connection disconnects
const userConnections: Map<UserId, Set<ConnectionId>> = new Map(); // mapping of userId to connectionIds to support handling inserting/deleting rooms on real-time

const addConnIdToUsersMap = (userId: string, connectionId: string): Map<string, Set<string>> =>
	userConnections.set(userId, (userConnections.get(userId) || new Set()).add(connectionId));

const updateMappingsOnSub = (connectionId: string, channels: Set<string>, userId: string): void => {
	addConnIdToUsersMap(userId, connectionId);

	connectionToChannels.set(connectionId, channels);

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

const removeConnectionFromUserConns = (userId: string, connectionId: string): void => {
	const userCurrConnections = userConnections.get(userId);
	if (userCurrConnections?.size === 1) {
		userConnections.delete(userId);
	} else {
		userCurrConnections?.delete(connectionId);
	}
};


const removeConnectionId = (connectionId: string, userId: string): void => {
	decreaseChannelsBinding(connectionId);
	removeConnectionFromUserConns(userId, connectionId);
	connectionToChannels.delete(connectionId); // TODO-Hi: Maybe had debounce/something to handle user refreshes
};

setInterval(() => {
	// console.log(channelListeners);
	console.log(connectionToChannels);
	// console.log(userConnections);
}, 5000);

export { removeConnectionId, updateMappingsOnSub, userConnections };
