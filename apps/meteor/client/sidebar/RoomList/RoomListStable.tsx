import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { CachedChatRoom } from '../../../app/models/client/models/CachedChatRoom';
import { CachedChatSubscription } from '../../../app/models/client/models/CachedChatSubscription';
import { useQueryOptions } from '../hooks/useQueryOptions';
import RoomList from './RoomList';

const query = { open: { $ne: false } };

const RoomListStable = (): ReactElement => {
	const [options] = useQueryOptions();

	useEffect(() => {
		CachedChatSubscription.init();
		CachedChatRoom.init();
	}, []);

	const subscriptions = useUserSubscriptions(query, options);
	return <RoomList subscriptions={subscriptions} />;
};

export default RoomListStable;
