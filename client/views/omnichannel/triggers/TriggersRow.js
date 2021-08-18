import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const TriggersRow = memo(function TriggersRow(props) {
	const { _id, name, description, enabled, onDelete } = props;

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const setModal = useSetModal();

	const bhRoute = useRoute('omnichannel-triggers');

	const deleteTrigger = useMethod('livechat:removeTrigger');

	const handleClick = useMutableCallback(() => {
		bhRoute.push({
			context: 'edit',
			id: _id,
		});
	});

	const handleKeyDown = useMutableCallback((e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteTrigger = async () => {
			try {
				await deleteTrigger(_id);
				dispatchToastMessage({ type: 'success', message: t('Trigger_removed') });
				onDelete();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteTrigger}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Table.Row
			key={_id}
			role='link'
			action
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			<Table.Cell withTruncatedText>{name}</Table.Cell>
			<Table.Cell withTruncatedText>{description}</Table.Cell>
			<Table.Cell withTruncatedText>{enabled ? t('Yes') : t('No')}</Table.Cell>
			<Table.Cell withTruncatedText>
				<Button small ghost title={t('Remove')} onClick={handleDelete}>
					<Icon name='trash' size='x16' />
				</Button>
			</Table.Cell>
		</Table.Row>
	);
});

export default TriggersRow;
