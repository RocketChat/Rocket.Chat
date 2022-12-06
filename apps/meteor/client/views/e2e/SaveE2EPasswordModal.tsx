import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../components/GenericModal';

const SaveE2EPasswordModal = ({
	passwordRevealText,
	onClose,
	onCancel,
	onConfirm,
}: {
	passwordRevealText: string;
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
}): ReactElement => {
	const t = useTranslation();

	return (
		<GenericModal
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			cancelText={t('Do_It_Later')}
			confirmText={t('I_Saved_My_Password')}
			variant='warning'
			title={t('Save_Your_Encryption_Password')}
		>
			<Box dangerouslySetInnerHTML={{ __html: passwordRevealText }} />
		</GenericModal>
	);
};

export default SaveE2EPasswordModal;
