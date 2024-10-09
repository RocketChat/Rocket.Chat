import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';

import MatrixFederationSearch from '../../MatrixFederationSearch';
import { useCreateRoomModal } from '../../hooks/useCreateRoomModal';

export const useMatrixFederationItems = ({
	isMatrixEnabled,
}: {
	isMatrixEnabled: string | number | boolean | null | undefined;
}): GenericMenuItemProps[] => {
	const t = useTranslation();

	const searchFederatedRooms = useCreateRoomModal(MatrixFederationSearch);

	const matrixFederationSearchItem: GenericMenuItemProps = {
		id: 'matrix-federation-search',
		content: t('Federation_Search_federated_rooms'),
		icon: 'magnifier',
		onClick: () => {
			searchFederatedRooms();
		},
	};

	return [...(isMatrixEnabled ? [matrixFederationSearchItem] : [])];
};
