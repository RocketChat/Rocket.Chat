import { Modal, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MatrixFederationSearchModalContent from './MatrixFederationSearchModalContent';
import { useMatrixServerList } from './useMatrixServerList';

type MatrixFederationSearchProps = {
	onClose: () => void;
	defaultSelectedServer?: string;
};

const MatrixFederationSearch = ({ onClose, defaultSelectedServer }: MatrixFederationSearchProps) => {
	const { t } = useTranslation();
	const { data, isLoading } = useMatrixServerList();

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Federation_Federated_room_search')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent display='flex' flexDirection='column'>
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
			</ModalContent>
			<ModalFooter />
		</Modal>
	);
};

export default MatrixFederationSearch;
