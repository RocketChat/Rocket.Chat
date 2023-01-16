// import { useEndpoint } from '@rocket.chat/ui-contexts';
import { Modal, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import type { VFC } from 'react';

import MatrixFederationSearchModalContent from './MatrixFederationSearchModalContent';

type MatrixFederationSearchProps = {
	onClose: () => void;
};

const fetchServerList = () => ({
	servers: Array.from({ length: 5 }).map((_, index) => ({ name: `Server ${index}`, default: true, local: false })),
});

const MatrixFederationSearch: VFC<MatrixFederationSearchProps> = ({ onClose }) => {
	// const fetchRoomList = useEndpoint('GET', '/v1/federation/searchPublicRooms');
	const t = useTranslation();
	const { data, isLoading } = useQuery(['federation/listServersByUsers'], async () => fetchServerList());

	return (
		<Modal maxHeight={'x600'}>
			<Modal.Header>
				<Modal.Title>{t('Federation_Federated_room_search')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				{isLoading && <Skeleton />}
				{!isLoading && data?.servers && <MatrixFederationSearchModalContent servers={data.servers} />}
			</Modal.Content>
		</Modal>
	);
};

export default MatrixFederationSearch;
