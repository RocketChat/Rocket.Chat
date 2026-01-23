import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { omnichannelQueryKeys } from '../../../lib/queryKeys';

export const useRemoveCustomField = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeCustomField = useEndpoint('POST', '/v1/livechat/custom-fields.delete');
	const queryClient = useQueryClient();

	const handleDelete = useEffectEvent((id: string) => {
		const onDeleteAgent = async () => {
			try {
				await removeCustomField({ customFieldId: id });
				dispatchToastMessage({ type: 'success', message: t('Custom_Field_Removed') });
				queryClient.invalidateQueries({
					queryKey: omnichannelQueryKeys.livechat.customFields(),
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
