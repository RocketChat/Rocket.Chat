import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import { CachedChatRoom } from '../../../app/models/client/models/CachedChatRoom';
import { CachedChatSubscription } from '../../../app/models/client/models/CachedChatSubscription';
import { useSubscriptions } from '../hooks/useSubscriptions';
import RoomList from './RoomList';

const cachedCollectionFunctions = {
	handleSubscription: (action: 'inserted' | 'updated' | 'removed', record: ISubscription) =>
		CachedChatSubscription.handleEvent(action === 'removed' ? action : 'changed', record),
	handleRoom: (action: 'inserted' | 'updated' | 'removed', record: IRoom) =>
		CachedChatRoom.handleEvent(action === 'removed' ? action : 'changed', record),
	applyFromServer: (subscriptions: ISubscription[], rooms: IRoom[]) => {
		CachedChatSubscription.applyFromServer(subscriptions);
		CachedChatRoom.applyFromServer(rooms);
	},
};

const RoomListPreview = (): ReactElement => {
	const userSubscriptions = useSubscriptions(cachedCollectionFunctions);
	return <RoomList subscriptions={userSubscriptions.data ?? []} />;
};

export default RoomListPreview;
