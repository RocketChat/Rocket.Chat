import { Throbber, Box } from '@rocket.chat/fuselage';
import type { IFederationPublicRooms } from '@rocket.chat/rest-typings';
import { useSetModal, useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../../components/CustomScrollbars';
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

const FederatedRoomList = ({ serverName, roomName, count }: FederatedRoomListProps) => {
	const joinExternalPublicRoom = useEndpoint('POST', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { data, isLoading, isFetchingNextPage, fetchNextPage } = useInfiniteFederationSearchPublicRooms(serverName, roomName, count);

	const { mutate: onClickJoin, isLoading: isLoadingMutation } = useMutation(
		['federation/joinExternalPublicRoom'],
		async ({ id, pageToken }: IFederationPublicRooms) =>
			joinExternalPublicRoom({ externalRoomId: id as `!${string}:${string}`, roomName, pageToken }),
		{
			onSuccess: (_, data) => {
				dispatchToastMessage({
					type: 'success',
					message: t('Your_request_to_join__roomName__has_been_made_it_could_take_up_to_15_minutes_to_be_processed', {
						roomName: data.name,
					}),
				});
				setModal(null);
			},
			onError: (error, { id }) => {
				if (error instanceof Error && error.message === 'already-joined') {
					setModal(null);
					roomCoordinator.openRouteLink('c', { rid: id });
					return;
				}

				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	if (isLoading) {
		return <Throbber />;
	}

	const flattenedData = data?.pages.flatMap((page) => page.rooms);
	return (
		<Box is='ul' overflow='hidden' height='356px' flexGrow={1} flexShrink={0} mi={-24}>
			<Virtuoso
				data={flattenedData || []}
				computeItemKey={(index, room) => room?.id || index}
				overscan={4}
				components={{
					// eslint-disable-next-line react/no-multi-comp
					Footer: () => (isFetchingNextPage ? <Throbber /> : null),
					Scroller: VirtuosoScrollbars,
					EmptyPlaceholder: FederatedRoomListEmptyPlaceholder,
				}}
				endReached={isLoading || isFetchingNextPage ? () => undefined : () => fetchNextPage()}
				itemContent={(_, room) => (
					<FederatedRoomListItem onClickJoin={() => onClickJoin(room)} {...room} disabled={isLoadingMutation} key={room.id} />
				)}
			/>
		</Box>
	);
};

export default FederatedRoomList;
