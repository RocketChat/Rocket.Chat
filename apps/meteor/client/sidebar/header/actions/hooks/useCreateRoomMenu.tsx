import { useAtLeastOnePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateRoomItems } from './useCreateRoomItems';
import { useMatrixFederationItems } from './useMatrixFederationItems';
import { useIsEnterprise } from '../../../../hooks/useIsEnterprise';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateRoom = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const { data } = useIsEnterprise();
	const matrixFederationEnabled = useSetting('Federation_Matrix_enabled');
	const serviceFederationEnabled = useSetting('FEDERATION_Service_Enabled');
	const isMatrixEnabled = (matrixFederationEnabled || serviceFederationEnabled) && data?.isEnterprise;

	const createRoomItems = useCreateRoomItems();
	const matrixFederationSearchItems = useMatrixFederationItems({ isMatrixEnabled });

	const sections = [
		{ title: t('Create_new'), items: createRoomItems, permission: showCreate },
		{ title: t('Explore'), items: matrixFederationSearchItems, permission: showCreate && isMatrixEnabled },
	];

	return sections.filter((section) => section.permission);
};
