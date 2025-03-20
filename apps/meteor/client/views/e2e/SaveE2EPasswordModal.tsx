import { Box, CodeSnippet } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { ExternalLink } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';

type SaveE2EPasswordModalProps = {
	randomPassword: string;
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
};

const DOCS_URL = 'https://go.rocket.chat/i/e2ee-guide';

const SaveE2EPasswordModal = ({ randomPassword, onClose, onCancel, onConfirm }: SaveE2EPasswordModalProps): ReactElement => {
	const { t } = useTranslation();
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
			annotation={t('You_can_do_from_account_preferences')}
		>
			<p>
				<span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_password_reveal_text', { randomPassword })) }} />
				<ExternalLink to={DOCS_URL} mis={4}>
					{t('Learn_more_about_E2EE')}
				</ExternalLink>
			</p>
			<Box is='p' fontWeight='bold' mb={20}>
				{t('E2E_password_save_text')}
			</Box>
			<p>{t('Your_E2EE_password_is')}</p>
			<CodeSnippet buttonText={hasCopied ? t('Copied') : t('Copy')} buttonDisabled={hasCopied} onClick={() => copy()} mbs={8}>
				{randomPassword}
			</CodeSnippet>
		</GenericModal>
	);
};

export default SaveE2EPasswordModal;
