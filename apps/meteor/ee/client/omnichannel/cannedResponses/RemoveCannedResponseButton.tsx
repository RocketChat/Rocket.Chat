import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from '../../../../client/components/GenericModal';

export type RemoveCannedResponseButtonProps = {
	_id: string;
	reload: () => void;
	totalDataReload: () => void;
};

const RemoveCannedResponseButton: FC<RemoveCannedResponseButtonProps> = ({ _id, reload, totalDataReload }) => {
	const cannedResponsesRoute = useRoute('omnichannel-canned-responses');
	const removeCannedResponse = useMethod('removeCannedResponse');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeCannedResponse(_id);
		} catch (error) {
			console.log(error);
		}
		cannedResponsesRoute.push({});
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteCannedResponse: () => Promise<void> = async () => {
			try {
				await handleRemoveClick();
				reload();
				totalDataReload();
				dispatchToastMessage({ type: 'success', message: t('Canned_Response_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};
		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteCannedResponse}
				onCancel={(): void => setModal(null)}
				onClose={(): void => setModal(null)}
				confirmText={t('Delete')}
			></GenericModal>,
		);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
};

export default RemoveCannedResponseButton;
