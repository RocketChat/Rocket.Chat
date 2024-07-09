import { Field, FieldHint, FieldLabel, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const ContactGroupModal = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Create_group')}
			onCancel={onCancel}
			onConfirm={onConfirm}
			confirmText={t('Create')}
		>
			<Field>
				<FieldLabel>{t('Group_name')}</FieldLabel>
				<TextInput />
				<FieldHint>{t('Only_visible_internally')}</FieldHint>
			</Field>
		</GenericModal>
	);
};

export default ContactGroupModal;
