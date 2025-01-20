import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import GenericModal from '../../components/GenericModal';

export const useRemoveUnit = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();
	const removeUnit = useMethod('livechat:removeUnit');

	const handleDelete = useEffectEvent((id: string) => {
		const onDeleteAgent = async () => {
			try {
				await removeUnit(id);
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
