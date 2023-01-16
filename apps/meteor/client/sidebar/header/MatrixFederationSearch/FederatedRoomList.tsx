// import { useEndpoint } from '@rocket.chat/ui-contexts';
import { Throbber, Box } from '@rocket.chat/fuselage';
import { useSetModal, useEndpoint } from '@rocket.chat/ui-contexts';
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

const FederatedRoomList: VFC<FederatedRoomListProps> = ({ serverName, roomName, pageToken, count }) => {
	const fetchRoomList = useEndpoint('GET', '/v1/federation/searchPublicRooms');
	const joinExternalPublicRoom = useEndpoint('POST', '/v1/federation/joinExternalPublicRoom');

	const setModal = useSetModal();
	const { data, isLoading } = useQuery(
		['federation/searchPublicRooms', serverName, roomName, pageToken, count],
		async () => fetchRoomList({ serverName, roomName, pageToken, count }),
		{ keepPreviousData: true },
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

	return (
		<Box is='ul'>
			{data?.rooms.map(({ id, ...props }) => (
				<FederatedRoomListItem onClickJoin={() => onClickJoin(id)} disabled={isLoadingMutation} {...props} key={id} />
			))}
		</Box>
	);
};

export default FederatedRoomList;
