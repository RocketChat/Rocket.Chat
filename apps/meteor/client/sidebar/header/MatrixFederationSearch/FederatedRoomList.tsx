import { Throbber, Box } from '@rocket.chat/fuselage';
import { useSetModal, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { VFC } from 'react';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import FederatedRoomListEmptyPlaceholder from './FederatedRoomListEmptyPlaceholder';
import FederatedRoomListItem from './FederatedRoomListItem';
import { useInfiniteFederationSearchPublicRooms } from './useInfiniteFederationSearchPublicRooms';

type FederatedRoomListProps = {
	serverName: string;
	roomName?: string;
	pageToken?: string;
	count?: number;
};

const FederatedRoomList: VFC<FederatedRoomListProps> = ({ serverName, roomName, count }) => {
	const joinExternalPublicRoom = useEndpoint('POST', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const { data, isLoading, isFetchingNextPage, fetchNextPage } = useInfiniteFederationSearchPublicRooms(serverName, roomName, count);

	const { mutate: onClickJoin, isLoading: isLoadingMutation } = useMutation(
		['federation/joinExternalPublicRoom'],
		async (id: string) => {
			return joinExternalPublicRoom({ externalRoomId: id as `!${string}:${string}` });
		},
		{
			onSuccess: (_, id) => {
				setModal(null);
				roomCoordinator.openRouteLink('c', { rid: id });
			},
			onError: (error, id) => {
				if (error instanceof Error && error.message === 'already-joined') {
					setModal(null);
					roomCoordinator.openRouteLink('c', { rid: id });
				}
			},
		},
	);

	if (isLoading) {
		return <Throbber />;
	}

	const flattenedData = data?.pages.flatMap((page) => page.rooms);
	return (
		<Box is='ul' overflow='hidden' height='356px' flexGrow={1} flexShrink={0}>
			<Virtuoso
				data={flattenedData || []}
				totalCount={data?.pages[data?.pages.length - 1].total || 0}
				computeItemKey={(index, room) => room.id || index}
				overscan={4}
				components={{
					Footer: isFetchingNextPage ? Throbber : undefined,
					Scroller: ScrollableContentWrapper,
					EmptyPlaceholder: FederatedRoomListEmptyPlaceholder,
				}}
				endReached={() => fetchNextPage()}
				itemContent={(_, { id, ...props }) => (
					<FederatedRoomListItem onClickJoin={() => onClickJoin(id)} disabled={isLoadingMutation} {...props} key={id} />
				)}
			/>
		</Box>
	);
};

export default FederatedRoomList;
