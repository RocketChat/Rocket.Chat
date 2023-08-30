import { Box, Button } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../components/GenericModal';

type SaveE2EPasswordModalProps = {
	randomPassword: string;
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
};

const SaveE2EPasswordModal = ({ randomPassword, onClose, onCancel, onConfirm }: SaveE2EPasswordModalProps): ReactElement => {
	const t = useTranslation();
	const { copy, hasCopied } = useClipboard(randomPassword);

	return (
		<GenericModal
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			cancelText={t('Do_It_Later')}
			confirmText={t('I_Saved_My_Password')}
			variant='warning'
			title={t('Save_your_encryption_password')}
		>
			<>
				<Box dangerouslySetInnerHTML={{ __html: t('E2E_password_reveal_text', { randomPassword }) }} />
				<Button disabled={hasCopied} small mbs={24} onClick={() => copy()}>
					{hasCopied ? t('Copied') : t('Copy_password')}
				</Button>
			</>
		</GenericModal>
	);
};

export default SaveE2EPasswordModal;
