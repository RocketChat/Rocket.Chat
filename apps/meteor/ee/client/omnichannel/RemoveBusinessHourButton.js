import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../client/components/GenericModal';
import { GenericTableCell } from '../../../client/components/GenericTable';

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

		setModal(<GenericModal variant='danger' onConfirm={onBusinessHour} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' onClick={handleDelete} withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
}

export default RemoveBusinessHourButton;
