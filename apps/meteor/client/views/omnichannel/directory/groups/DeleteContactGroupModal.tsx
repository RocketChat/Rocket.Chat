import { Box, Field, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const DeleteContactGroupModal = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => {
	const t = useTranslation();

	return (
		<GenericModal variant='danger' title={t('Delete_group')} onCancel={onCancel} onConfirm={onConfirm} confirmText={t('Delete')}>
			<Box>Are you sure you want to delete this group? This action cannot be undone. Please enter the group name to confirm.</Box>
			<Field>
				<FieldRow>
					<TextInput />
				</FieldRow>
			</Field>
		</GenericModal>
	);
};

export default DeleteContactGroupModal;
