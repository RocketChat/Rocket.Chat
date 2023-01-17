import { Modal, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import type { VFC } from 'react';

import MatrixFederationSearchModalContent from './MatrixFederationSearchModalContent';

type MatrixFederationSearchProps = {
	onClose: () => void;
	defaultSelectedServer?: string;
};
const fetchServerList = () => ({
	servers: Array.from({ length: 5 }).map((_, index) => ({ name: `Server ${index}`, default: true, local: false })),
});
const MatrixFederationSearch: VFC<MatrixFederationSearchProps> = ({ onClose, defaultSelectedServer }) => {
	// const fetchServerList = useEndpoint('GET', '/v1/federation/listServersByUser');
	const t = useTranslation();
	const { data, isLoading } = useQuery(['federation/listServersByUsers'], async () => fetchServerList());

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Federation_Federated_room_search')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content display='flex' flexDirection='column' h='full' maxHeight={'x400'}>
				{isLoading && (
					<>
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
					</>
				)}
				{!isLoading && data?.servers && (
					<MatrixFederationSearchModalContent defaultSelectedServer={defaultSelectedServer} servers={data.servers} />
				)}
			</Modal.Content>
			<Modal.Footer />
		</Modal>
	);
};

export default MatrixFederationSearch;
