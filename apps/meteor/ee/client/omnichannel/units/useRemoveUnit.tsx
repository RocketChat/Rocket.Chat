import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';

export const useRemoveUnit = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();
	const removeUnit = useMethod('livechat:removeUnit');

	const handleDelete = useMutableCallback((id) => {
		const onDeleteAgent = async () => {
			try {
				await removeUnit(id);
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
				router.navigate('/omnichannel/units');
				queryClient.invalidateQueries(['livechat-units']);
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
