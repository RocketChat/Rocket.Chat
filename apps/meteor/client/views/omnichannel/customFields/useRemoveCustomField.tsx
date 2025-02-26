import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';

export const useRemoveCustomField = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeCustomField = useMethod('livechat:removeCustomField');
	const queryClient = useQueryClient();

	const handleDelete = useEffectEvent((id: string) => {
		const onDeleteAgent = async () => {
			try {
				await removeCustomField(id);
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
