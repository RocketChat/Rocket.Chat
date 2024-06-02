import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../components/GenericModal';

export const useRemoveCustomField = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeCustomField = useMethod('livechat:removeCustomField');
	const queryClient = useQueryClient();

	const handleDelete = useMutableCallback((id) => {
		const onDeleteAgent = async () => {
			try {
				await removeCustomField(id);
				dispatchToastMessage({ type: 'success', message: t('Custom_Field_Removed') });
				queryClient.invalidateQueries(['livechat-customFields']);
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
