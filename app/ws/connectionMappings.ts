import redis from '../redis/redis';
import { acquireLock, acquireLocks, lockUser } from './channelLocks';

type ConnectionId = string;
type ChannelName = string;
type UserId = string;

const channelListeners: Map<ChannelName, Set<ConnectionId>> = new Map(); // the most important one, which declares if a redis channel should be subscribed or not
const connectionToChannels: Map<ConnectionId, Set<ChannelName>> = new Map(); // for supporting updating due to client connection disconnects
const userConnections: Map<UserId, Set<ConnectionId>> = new Map(); // mapping of userId to connectionIds to support handling inserting/deleting rooms on real-time

const addConnIdToUsersMap = (userId: string, connectionId: string): void => {
	const userCurrConns = userConnections.get(userId);
	if (userCurrConns) {
		userCurrConns.add(connectionId);
	} else {
		userConnections.set(userId, new Set([connectionId]));
	}
};

const updateMappingsOnSub = (connectionId: string, channels: Set<string>, userId: string): void => {
	addConnIdToUsersMap(userId, connectionId);

	connectionToChannels.set(connectionId, channels);

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

const removeConnectionFromUserConns = (userId: string, connectionId: string): void => {
	const userCurrConnections = userConnections.get(userId);
	if (userCurrConnections?.size === 1) {
		userConnections.delete(userId);
	} else {
		userCurrConnections?.delete(connectionId);
	}
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
		removeConnectionFromUserConns(userId, connectionId);

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
