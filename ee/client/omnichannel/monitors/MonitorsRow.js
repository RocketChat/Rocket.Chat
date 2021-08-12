import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

function MonitorsRow(props) {
	const { _id, name, username, emails, onDelete } = props;

	const setModal = useSetModal();

	const dispatchToastMessage = useToastMessageDispatch();

	const t = useTranslation();

	const removeMonitor = useMethod('livechat:removeMonitor');

	const handleRemove = useMutableCallback(() => {
		const onDeleteMonitor = async () => {
			try {
				await removeMonitor(username);
				dispatchToastMessage({ type: 'success', message: t('Monitor_removed') });
				onDelete();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteMonitor}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Table.Row key={_id} role='link' action tabIndex={0}>
			<Table.Cell withTruncatedText>{name}</Table.Cell>
			<Table.Cell withTruncatedText>{username}</Table.Cell>
			<Table.Cell withTruncatedText>{emails?.find(({ address }) => !!address)?.address}</Table.Cell>
			<Table.Cell withTruncatedText>
				<Button small ghost title={t('Remove')} onClick={handleRemove}>
					<Icon name='trash' size='x16' />
				</Button>
			</Table.Cell>
		</Table.Row>
	);
}

export default memo(MonitorsRow);
