import { useTranslation } from '@rocket.chat/ui-contexts';

import MatrixFederationSearch from '../../MatrixFederationSearch';
import { useCreateRoomModal } from '../../hooks/useCreateRoomModal';
import type { Item } from './useSortModeItems';

export const useMatrixFederationItems = ({
	isMatrixEnabled,
}: {
	isMatrixEnabled: string | number | boolean | null | undefined;
}): Item[] => {
	const t = useTranslation();

	const searchFederatedRooms = useCreateRoomModal(MatrixFederationSearch);

	const matrixFederationSearchItem: Item = {
		id: 'matrix-federation-search',
		name: t('Federation_Search_federated_rooms'),
		icon: 'magnifier',
		onClick: () => {
			searchFederatedRooms();
		},
	};

	return [...(isMatrixEnabled ? [matrixFederationSearchItem] : [])];
};
