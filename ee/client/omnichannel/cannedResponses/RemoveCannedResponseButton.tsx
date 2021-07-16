import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

export type RemoveCannedResponseButtonProps = {
	_id: string;
};

const RemoveCannedResponseButton: FC<RemoveCannedResponseButtonProps> = ({ _id }) => {
	const unitsRoute = useRoute('omnichannel-units');
	const removeUnit = useMethod('livechat:removeUnit');
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
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteCannedResponse: () => Promise<void> = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
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
		<Table.Cell fontScale='p1' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
};

export default RemoveCannedResponseButton;
