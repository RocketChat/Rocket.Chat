import { Box, CodeSnippet } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { ExternalLink } from '@rocket.chat/ui-client';
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

const DOCS_URL = 'https://rocket.chat/docs/user-guides/end-to-end-encryption/';

const SaveE2EPasswordModal = ({ randomPassword, onClose, onCancel, onConfirm }: SaveE2EPasswordModalProps): ReactElement => {
	const t = useTranslation();
	const { copy } = useClipboard(randomPassword);

	return (
		<GenericModal
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			cancelText={t('Do_It_Later')}
			confirmText={t('I_Saved_My_Password')}
			variant='warning'
			title={t('Save_your_encryption_password')}
			annotation={t('You_can_do_from_account_preferences')}
		>
			<Box fontScale='p1'>
				<Box is='span'>
					<Box is='span'>{t('E2E_password_reveal_text')}</Box>
					<ExternalLink to={DOCS_URL} mis={4}>
						{t('Learn_more_about_E2EE')}
					</ExternalLink>
				</Box>
				<Box fontWeight='bold' mb={20}>
					{t('E2E_password_save_text')}
				</Box>
				{t('Your_E2EE_password_is')}
				<CodeSnippet buttonText={t('Copy')} onClick={() => copy()}>
					{randomPassword}
				</CodeSnippet>
			</Box>
		</GenericModal>
	);
};

export default SaveE2EPasswordModal;
