import type { IRoom } from '@rocket.chat/core-typings';

import ParentDiscussion from './ParentDiscussion';
import { useRoomInfoEndpoint } from '../../../../../hooks/useRoomInfoEndpoint';

export type ParentDiscussionWithDataProps = { rid: IRoom['_id'] };

const ParentDiscussionWithData = ({ rid }: ParentDiscussionWithDataProps) => {
	const { data, isPending, isError } = useRoomInfoEndpoint(rid);

	if (isError || !data?.room) {
		return null;
	}

	return <ParentDiscussion loading={isPending} room={data.room} />;
};

export default ParentDiscussionWithData;
