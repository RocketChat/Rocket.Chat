import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';

function RemoveUnitButton({ _id, reload }) {
	const removeUnit = useMethod('livechat:removeUnit');
	const unitsRoute = useRoute('omnichannel-units');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeUnit(_id);
		} catch (error) {
			console.log(error);
		}
		unitsRoute.push({});
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
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

export default RemoveUnitButton;
