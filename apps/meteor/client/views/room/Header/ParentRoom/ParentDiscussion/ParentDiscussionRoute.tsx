import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import ParentDiscussion from './ParentDiscussion';
import ParentDiscussionWithData from './ParentDiscussionWithData';

export type ParentDiscussionRouteProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentDiscussionRoute = ({ room }: ParentDiscussionRouteProps) => {
	const { prid } = room;

	if (!prid) {
		throw new Error('Parent room ID is missing');
	}

	const subscription = useUserSubscription(prid);
	const parentRoomProps = useMemo(
		() =>
			subscription
				? {
						_id: subscription.rid,
						t: subscription.t,
						name: subscription.name,
						fname: subscription.fname,
						u: subscription.u,
						federated: (subscription as any).federated as IRoom['federated'],
					}
				: undefined,
		[subscription],
	);

	if (subscription && parentRoomProps) {
		return <ParentDiscussion room={parentRoomProps} />;
	}

	return <ParentDiscussionWithData rid={prid} />;
};

export default ParentDiscussionRoute;
