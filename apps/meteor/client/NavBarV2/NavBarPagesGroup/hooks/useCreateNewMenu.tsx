import { useAtLeastOnePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import { useMatrixFederationItems } from './useMatrixFederationItems';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const { data } = useIsEnterprise();
	const isMatrixEnabled = useSetting('Federation_Matrix_enabled') && data?.isEnterprise;

	const createRoomItems = useCreateNewItems();
	const matrixFederationSearchItems = useMatrixFederationItems({ isMatrixEnabled });

	const sections = [
		{ title: t('Create_new'), items: createRoomItems, permission: showCreate },
		{ title: t('Explore'), items: matrixFederationSearchItems, permission: showCreate && isMatrixEnabled },
	];

	return sections.filter((section) => section.permission);
};
