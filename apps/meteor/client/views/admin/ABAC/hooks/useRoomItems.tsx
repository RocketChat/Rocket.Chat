import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import GenericModal from '@rocket.chat/ui-client/dist/components/Modal/GenericModal';
import { useRouter, useSetModal, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

import useIsABACAvailable from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const useRoomItems = (room: { rid: string; name: string }): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const deleteRoom = useEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', { rid: room.rid });
	const dispatchToastMessage = useToastMessageDispatch();
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

	const deleteMutation = useMutation({
		mutationFn: deleteRoom,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_removed', { roomName: room.name }) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.all() });
			setModal(null);
		},
	});

	const deleteAction = useEffectEvent(async () => {
		setModal(
			<GenericModal
				variant='danger'
				icon={null}
				title={t('ABAC_Delete_room')}
				annotation={t('ABAC_Delete_room_annotation')}
				confirmText={t('Remove')}
				onConfirm={() => {
					deleteMutation.mutateAsync(undefined);
				}}
				onCancel={() => setModal(null)}
			>
				<Trans
					i18nKey='ABAC_Delete_room_content'
					values={{ roomName: room.name }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			</GenericModal>,
		);
	});

	return [
		{ id: 'edit', icon: 'edit' as const, content: t('Edit'), onClick: () => editAction(), disabled: isABACAvailable !== true },
		{
			id: 'delete',
			iconColor: 'danger',
			icon: 'cross' as const,
			content: <Box color='danger'>{t('Remove')}</Box>,
			onClick: () => deleteAction(),
		},
	];
};

export default useRoomItems;
