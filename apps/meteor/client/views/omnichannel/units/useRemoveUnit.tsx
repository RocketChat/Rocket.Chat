import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useTranslation, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

export const useRemoveUnit = (id: string) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();
	const removeUnit = useEndpoint('DELETE', '/v1/livechat/units/:id', { id });

	const handleDelete = useEffectEvent(() => {
		const onDeleteAgent = async () => {
			try {
				await removeUnit();
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
				router.navigate('/omnichannel/units');
				queryClient.invalidateQueries({
					queryKey: ['livechat-units'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(
			<GenericModal
				data-qa-id='units-confirm-delete-modal'
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return handleDelete;
};
