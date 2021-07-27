import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../client/components/GenericModal';
import { useSetModal } from '../../../client/contexts/ModalContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../client/contexts/TranslationContext';

function RemoveBusinessHourButton({ _id, type, reload }) {
	const removeBusinessHour = useMethod('livechat:removeBusinessHour');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeBusinessHour(_id, type);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onBusinessHour = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Business_Hour_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onBusinessHour}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Table.Cell fontScale='p1' color='hint' onClick={handleDelete} withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
}

export default RemoveBusinessHourButton;
