import { useTranslation } from '@rocket.chat/ui-contexts';

import type { GenericMenuItem } from '../../../../components/GenericMenuContent';
import MatrixFederationSearch from '../../MatrixFederationSearch';
import { useCreateRoomModal } from '../../hooks/useCreateRoomModal';

export const useMatrixFederationItems = ({
	isMatrixEnabled,
}: {
	isMatrixEnabled: string | number | boolean | null | undefined;
}): GenericMenuItem[] => {
	const t = useTranslation();

	const searchFederatedRooms = useCreateRoomModal(MatrixFederationSearch);

	const matrixFederationSearchItem: GenericMenuItem = {
		id: 'matrix-federation-search',
		content: t('Federation_Search_federated_rooms'),
		icon: 'magnifier',
		onClick: () => {
			searchFederatedRooms();
		},
	};

	return [...(isMatrixEnabled ? [matrixFederationSearchItem] : [])];
};
