import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveCannedResponse = (id: IOmnichannelCannedResponse['_id']) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const queryClient = useQueryClient();

	const dispatchToastMessage = useToastMessageDispatch();
	const removeCannedResponse = useEndpoint('DELETE', '/v1/canned-responses/:_id', { _id: id });

	const handleDelete = useEffectEvent(() => {
		const onDeleteCannedResponse: () => Promise<void> = async () => {
			try {
				await removeCannedResponse();
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
