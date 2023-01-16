import { Modal, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import type { VFC } from 'react';

import MatrixFederationSearchModalContent from './MatrixFederationSearchModalContent';

type MatrixFederationSearchProps = {
	onClose: () => void;
};

const MatrixFederationSearch: VFC<MatrixFederationSearchProps> = ({ onClose }) => {
	const fetchServerList = useEndpoint('GET', '/v1/federation/listServersByUser');
	const t = useTranslation();
	const { data, isLoading } = useQuery(['federation/listServersByUsers'], async () => fetchServerList());

	return (
		<Modal maxHeight={'x600'}>
			<Modal.Header>
				<Modal.Title>{t('Federation_Federated_room_search')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content overflow='hidden'>
				{isLoading && <Skeleton />}
				{!isLoading && data?.servers && <MatrixFederationSearchModalContent servers={data.servers} />}
			</Modal.Content>
			<Modal.Footer />
		</Modal>
	);
};

export default MatrixFederationSearch;
