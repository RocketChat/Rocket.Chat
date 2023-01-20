import { Throbber, Box } from '@rocket.chat/fuselage';
import { useSetModal, useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import type { VFC } from 'react';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import FederatedRoomListItem from './FederatedRoomListItem';

type FederatedRoomListProps = {
	serverName: string;
	roomName?: string;
	pageToken?: string;
	count?: number;
};

const FederatedRoomList: VFC<FederatedRoomListProps> = ({ serverName, roomName, count }) => {
	const fetchRoomList = useEndpoint('GET', '/v1/federation/searchPublicRooms');
	const joinExternalPublicRoom = useEndpoint('POST', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const { data, isLoading, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
		['federation/searchPublicRooms', serverName, roomName, count],
		async ({ pageParam }) => fetchRoomList({ serverName, roomName, count, pageToken: pageParam }),
		{ getNextPageParam: (lastPage) => lastPage.nextPageToken },
	);

	const { mutate: onClickJoin, isLoading: isLoadingMutation } = useMutation(
		['federation/joinExternalPublicRoom'],
		async (id: string) => {
			return joinExternalPublicRoom({ externalRoomId: id as `!${string}:${string}` });
		},
		{ onSuccess: () => setModal(null) },
	);

	if (isLoading) {
		return <Throbber />;
	}

	const flattenedData = data?.pages.flatMap((page) => page.rooms);
	return (
		<Box is='ul' overflow='hidden' height='300px' flexGrow={1} flexShrink={0}>
			<Virtuoso
				data={flattenedData || []}
				totalCount={data?.pages[data?.pages.length - 1].total || 0}
				overscan={4}
				components={{ Footer: isFetchingNextPage ? Throbber : undefined, Scroller: ScrollableContentWrapper }}
				endReached={() => fetchNextPage()}
				itemContent={(_, { id, ...props }) => (
					<FederatedRoomListItem onClickJoin={() => onClickJoin(id)} disabled={isLoadingMutation} {...props} key={id} />
				)}
			/>
		</Box>
	);
};

export default FederatedRoomList;
