import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRouter, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';

export const useRemoveCannedResponse = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const queryClient = useQueryClient();

	const dispatchToastMessage = useToastMessageDispatch();
	const removeCannedResponse = useMethod('removeCannedResponse');

	const handleDelete = useEffectEvent((id: string) => {
		const onDeleteCannedResponse: () => Promise<void> = async () => {
			try {
				await removeCannedResponse(id);
				queryClient.invalidateQueries({
					queryKey: ['getCannedResponses'],
				});
				router.navigate('/omnichannel/canned-responses');
				dispatchToastMessage({ type: 'success', message: t('Canned_Response_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteCannedResponse}
				onCancel={() => setModal(null)}
				onClose={() => setModal(null)}
				confirmText={t('Delete')}
			/>,
		);
	});

	return handleDelete;
};
