import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

import ParentDiscussion from './ParentDiscussion';
import ParentDiscussionWithData from './ParentDiscussionWithData';

type ParentDiscussionRouteProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentDiscussionRoute = ({ room }: ParentDiscussionRouteProps) => {
	const { prid } = room;

	if (!prid) {
		throw new Error('Parent room ID is missing');
	}

	const subscription = useUserSubscription(prid);

	if (subscription) {
		return <ParentDiscussion room={subscription} />;
	}

	return <ParentDiscussionWithData rid={prid} />;
};

export default ParentDiscussionRoute;
