import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericModal } from '@rocket.chat/ui-client';
import { useRouter, useSetModal, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

import { useIsABACAvailable } from './useIsABACAvailable';
import { useViewRoomsAction } from './useViewRoomsAction';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

export const useAttributeOptions = (attribute: { _id: string; key: string }): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const deleteAttribute = useEndpoint('DELETE', '/v1/abac/attributes/:_id', { _id: attribute._id });
	const isAttributeUsed = useEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', { key: attribute.key });
	const dispatchToastMessage = useToastMessageDispatch();
	const isABACAvailable = useIsABACAvailable();
	const viewRoomsAction = useViewRoomsAction();

	const editAction = useEffectEvent(() => {
		return router.navigate(
			{
				name: 'admin-ABAC',
				params: {
					tab: 'room-attributes',
					context: 'edit',
					id: attribute._id,
				},
			},
			{ replace: true },
		);
	});

	const deleteMutation = useMutation({
		mutationFn: deleteAttribute,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Attribute_deleted', { attributeName: attribute.key }) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.roomAttributes.all() });
			setModal(null);
		},
	});

	const deleteAction = useEffectEvent(async () => {
		const isUsed = await isAttributeUsed();
		if (isUsed.inUse) {
			return setModal(
				<GenericModal
					variant='warning'
					icon={null}
					title={t('ABAC_Cannot_delete_attribute')}
					confirmText={t('View_rooms')}
					onConfirm={() => {
						viewRoomsAction(attribute.key);
						setModal(null);
					}}
					onCancel={() => setModal(null)}
				>
					<Trans
						i18nKey='ABAC_Cannot_delete_attribute_content'
						values={{ attributeName: attribute.key }}
						components={{ bold: <Box is='span' fontWeight='bold' /> }}
					/>
				</GenericModal>,
			);
		}
		setModal(
			<GenericModal
				variant='danger'
				icon={null}
				title={t('ABAC_Delete_room_attribute')}
				confirmText={t('Delete')}
				onConfirm={() => {
					deleteMutation.mutateAsync(undefined);
				}}
				onCancel={() => setModal(null)}
			>
				<Trans
					i18nKey='ABAC_Delete_room_attribute_content'
					values={{ attributeName: attribute.key }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			</GenericModal>,
		);
	});

	return [
		{ id: 'edit', icon: 'edit' as const, content: t('Edit'), onClick: () => editAction(), disabled: !isABACAvailable },
		{
			id: 'delete',
			iconColor: 'danger',
			icon: 'trash' as const,
			content: <Box color='danger'>{t('Delete')}</Box>,
			onClick: () => deleteAction(),
		},
	];
};
