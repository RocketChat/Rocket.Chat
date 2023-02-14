import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';

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

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</Table.Cell>
	);
}

export default RemoveTagButton;
