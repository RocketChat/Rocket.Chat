import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveCustomField = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeCustomField = useEndpoint('POST', '/v1/livechat/custom-fields.remove');
	const queryClient = useQueryClient();

	const handleDelete = useEffectEvent((id: string) => {
		const onDeleteAgent = async () => {
			try {
				await removeCustomField({ _id: id });
				dispatchToastMessage({ type: 'success', message: t('Custom_Field_Removed') });
				queryClient.invalidateQueries({
					queryKey: ['livechat-customFields'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return handleDelete;
};
