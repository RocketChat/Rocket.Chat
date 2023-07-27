import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { GenericTableCell } from '../../../components/GenericTable';

const RemoveCustomFieldButton = ({ _id, reload }: { _id: ILivechatCustomField['_id']; reload: () => void }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeCustomField = useMethod('livechat:removeCustomField');

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await removeCustomField(_id);
				dispatchToastMessage({ type: 'success', message: t('Custom_Field_Removed') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveCustomFieldButton;
