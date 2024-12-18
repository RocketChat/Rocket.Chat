import { Subscriptions } from '../models/server';
import { settings } from '../settings/server';
import { addChannelOnCreate, decreaseChannelListenerCountOnUser, removeConnectionId, updateMappingsOnSub } from './connectionMappings';
import './createRoomsTest';

const onLogin = (userId: string, connectionId: string): void => {
	console.log('Subscribing to ', userId);

	const channels: Set<string> = new Set(Subscriptions.findByUserId(userId, { rid: 1 }).map(({ rid }: { rid: string }) => `room-${ rid }`));
	channels.add(`user-${ userId }`);
	updateMappingsOnSub(connectionId, channels, userId);
};

const onDisconnect = (userId: string, connectionId: string): void => {
	console.log(`Unsubscribing connectionId: ${ connectionId }, userId: ${ userId }`);
	setTimeout(() => { // this is to prevent unncessary channels unsub then sub on client refreshes
		removeConnectionId(connectionId, userId);
	}, settings.get('Delay_On_Client_Disconnection') as number);
};

const removeUserBindToRoom = (roomId: string, userId: string): void => {
	const channel = `room-${ roomId }`;
	decreaseChannelListenerCountOnUser(channel, userId);
};

// TODO-Hi: Check in carosulle
// TODO-Hi: Check race-condition on critical sections
// TODO-Hi: Check with or if we should find the object in message subscriptions
const ChannelHandler = { onLogin, onDisconnect, addChannelOnCreate, removeUserBindToRoom };

export default ChannelHandler;
