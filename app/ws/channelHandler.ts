import { Subscriptions } from '../models/server';
import redis from '../redis/redis';
import { settings } from '../settings/server';
import { removeConnectionId, updateMappingsOnSub } from './connectionMappings';

const subscribe = (userId: string, connectionId: string): void => {
	console.log('Subscribing to ', userId);

	const channels: Set<string> = new Set(Subscriptions.findByUserId(userId, { rid: 1 }).map(({ rid }: { rid: string }) => `room-${ rid }`));
	channels.add(`user-${ userId }`);

	channels.forEach((channel: string) => {
		console.log('SUBSCRIBING TO ', channel);
		redis.subscribe(channel); // TODO-Hi: What to do if the subsribe fails
	});
	updateMappingsOnSub(connectionId, channels, userId);
};

const unsubscribe = (userId: string, connectionId: string): void => {
	console.log(`Unsubscribing connectionId: ${ connectionId }, userId: ${ userId }`);
	setTimeout(() => { // this is to prevent unncessary channels unsub then sub on client refreshes
		removeConnectionId(connectionId, userId);
	}, settings.get('Delay_On_Client_Disconnection') as number);
};

// TODO-Hi: Check in carosulle
// TODO-Hi: Check race-condition on critical sections
// TODO-Hi: Check with or if we should find the object in message subscriptions
const ChannelHandler = { subscribe, unsubscribe };

export default ChannelHandler;
