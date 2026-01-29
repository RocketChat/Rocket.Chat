import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useDeleteRoomModal } from './useDeleteRoomModal';
import { useIsABACAvailable } from './useIsABACAvailable';

export const useRoomItems = (room: { rid: string; name: string }): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const router = useRouter();
	const setDeleteRoomModal = useDeleteRoomModal(room);
	const isABACAvailable = useIsABACAvailable();

	const editAction = useEffectEvent(() => {
		return router.navigate(
			{
				name: 'admin-ABAC',
				params: {
					tab: 'rooms',
					context: 'edit',
					id: room.rid,
				},
			},
			{ replace: true },
		);
	});

	return [
		{ id: 'edit', icon: 'edit' as const, content: t('Edit'), onClick: () => editAction(), disabled: isABACAvailable !== true },
		{
			id: 'delete',
			iconColor: 'danger',
			icon: 'cross' as const,
			content: <Box color='danger'>{t('Remove')}</Box>,
			onClick: setDeleteRoomModal,
		},
	];
};
