import { Throbber, Box } from '@rocket.chat/fuselage';
import type { IFederationPublicRooms } from '@rocket.chat/rest-typings';
import { useSetModal, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import FederatedRoomListEmptyPlaceholder from './FederatedRoomListEmptyPlaceholder';
import FederatedRoomListItem from './FederatedRoomListItem';
import { useInfiniteFederationSearchPublicRooms } from './useInfiniteFederationSearchPublicRooms';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type FederatedRoomListProps = {
	serverName: string;
	roomName?: string;
	pageToken?: string;
	count?: number;
};

const FederatedRoomList = ({ serverName, roomName, count }: FederatedRoomListProps) => {
	const joinExternalPublicRoom = useEndpoint('POST', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { data, isPending, isFetchingNextPage, fetchNextPage } = useInfiniteFederationSearchPublicRooms(serverName, roomName, count);

	const { mutate: onClickJoin, isPending: isLoadingMutation } = useMutation({
		mutationKey: ['federation/joinExternalPublicRoom'],

		mutationFn: async ({ id, pageToken }: IFederationPublicRooms) => {
			return joinExternalPublicRoom({ externalRoomId: id as `!${string}:${string}`, roomName, pageToken });
		},

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
	});

	if (isPending) {
		return <Throbber />;
	}

	const flattenedData = data?.pages.flatMap((page) => page.rooms);
	return (
		<Box is='ul' overflow='hidden' height='356px' flexGrow={1} flexShrink={0} mi={-24}>
			<VirtualizedScrollbars>
				<Virtuoso
					data={flattenedData || []}
					computeItemKey={(index, room) => room?.id || index}
					overscan={4}
					components={{
						// eslint-disable-next-line react/no-multi-comp
						Footer: () => (isFetchingNextPage ? <Throbber /> : null),
						EmptyPlaceholder: FederatedRoomListEmptyPlaceholder,
					}}
					endReached={isPending || isFetchingNextPage ? () => undefined : () => fetchNextPage()}
					itemContent={(_, room) => (
						<FederatedRoomListItem onClickJoin={() => onClickJoin(room)} {...room} disabled={isLoadingMutation} key={room.id} />
					)}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default FederatedRoomList;
