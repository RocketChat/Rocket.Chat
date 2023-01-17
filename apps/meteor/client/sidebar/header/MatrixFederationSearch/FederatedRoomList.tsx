// import { useEndpoint } from '@rocket.chat/ui-contexts';
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

// const fetchRoomList = async ({ serverName, roomName, count, pageToken }: FederatedRoomListProps) => {
// 	console.log(pageToken);
// 	return new Promise((resolve) =>
// 		setTimeout(
// 			() =>
// 				resolve({
// 					rooms: Array.from({ length: count || 100 }).map(() => ({
// 						id: `${Math.random()}:${serverName}`,
// 						name: roomName || 'Matrix',
// 						canJoin: true,
// 						canonicalAlias: `#${serverName}:matrix.org`,
// 						joinedMembers: 44461,
// 						topic:
// 							'The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room',
// 					})),
// 					count: 1,
// 					total: 73080,
// 					nextPageToken: 'g6FtzZa3oXK+IUpkemFiTlVQUFh6bENKQWhFbDpmYWJyaWMucHVioWTD',
// 					prevPageToken: 'g6FtzYqIoXK+IWNOd2pkUXdWcFJNc0lNa1VweDptYXRyaXgub3JnoWTC',
// 					success: true,
// 				}),
// 			10000,
// 		),
// 	);
// };

// const joinExternalPublicRoom = (id: string) => console.log(id);

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
				overscan={25}
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
