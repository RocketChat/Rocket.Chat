import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

function RemoveTagButton({ _id, reload }) {
	const removeTag = useMethod('livechat:removeTag');
	const tagsRoute = useRoute('omnichannel-tags');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeTag(_id);
		} catch (error) {
			console.log(error);
		}
		tagsRoute.push({});
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Tag_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Table.Cell fontScale='p1' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
}

export default RemoveTagButton;
