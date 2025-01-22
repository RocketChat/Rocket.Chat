import { Modal, Skeleton } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
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
	const titleId = useUniqueId();

	return (
		<Modal open aria-labelledby={titleId}>
			<Modal.Header>
				<Modal.Title id={titleId}>{t('Federation_Federated_room_search')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content display='flex' flexDirection='column'>
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
