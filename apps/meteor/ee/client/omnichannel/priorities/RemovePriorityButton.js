import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';

function RemovePriorityButton({ _id, reload }) {
	const removePriority = useMethod('livechat:removePriority');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const prioritiesRoute = useRoute('omnichannel-priorities');

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removePriority(_id);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Priority_removed') });
				prioritiesRoute.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
}

export default RemovePriorityButton;
