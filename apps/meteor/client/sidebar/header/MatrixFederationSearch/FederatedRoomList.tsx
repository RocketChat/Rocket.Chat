// import { useEndpoint } from '@rocket.chat/ui-contexts';
import { Throbber, Box } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
// import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { VFC } from 'react';
import React from 'react';

import FederatedRoomListItem from './FederatedRoomListItem';

type FederatedRoomListProps = {
	serverName: string;
	roomName?: string;
	pageToken?: string;
	count?: number;
};

const fetchRoomList = ({ serverName, roomName, count }: FederatedRoomListProps) => {
	return {
		rooms: Array.from({ length: count || 100 }).map(() => ({
			id: `${Math.random()}:${serverName}`,
			name: roomName || 'Matrix',
			canJoin: true,
			canonicalAlias: `#${serverName}:matrix.org`,
			joinedMembers: 44461,
			topic:
				'The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room',
		})),
		count: 1,
		total: 73080,
		nextPageToken: 'g6FtzZa3oXK+IUpkemFiTlVQUFh6bENKQWhFbDpmYWJyaWMucHVioWTD',
		prevPageToken: 'g6FtzYqIoXK+IWNOd2pkUXdWcFJNc0lNa1VweDptYXRyaXgub3JnoWTC',
		success: true,
	};
};
const joinExternalPublicRoom = (id: string) => console.log(id);

const FederatedRoomList: VFC<FederatedRoomListProps> = ({ serverName, roomName, pageToken, count }) => {
	// const fetchRoomList = useEndpoint('GET', '/v1/federation/searchPublicRooms');
	// const joinExternalPublicRoom = useEndpoint('GET', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const { data, isLoading } = useQuery(
		['federation/searchPublicRooms', serverName, roomName, pageToken, count],
		async () => fetchRoomList({ serverName, roomName, pageToken, count }),
		{ keepPreviousData: true },
	);

	const { mutate: onClickJoin, isLoading: isLoadingMutation } = useMutation(
		['federation/joinExternalPublicRoom'],
		async (id: string) => {
			return joinExternalPublicRoom(id);
		},
		{ onSuccess: () => setModal(null) },
	);

	if (isLoading) {
		return <Throbber />;
	}

	return (
		<Box is='ul'>
			{data?.rooms.map(({ id, ...props }) => (
				<FederatedRoomListItem onClickJoin={() => onClickJoin(id)} disabled={isLoadingMutation} {...props} key={id} />
			))}
		</Box>
	);
};

export default FederatedRoomList;
