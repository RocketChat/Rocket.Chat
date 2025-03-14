import { Box, CodeSnippet } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';

type BackupCodesModalProps = {
	codes: string[];
	onClose: () => void;
};

const BackupCodesModal = ({ codes, onClose }: BackupCodesModalProps) => {
	const { t } = useTranslation();

	const codesText = useMemo(() => codes.join(' '), [codes]);
	const { copy, hasCopied } = useClipboard(codesText);

	return (
		<GenericModal title={t('Backup_codes')} onCancel={onClose} cancelText={t('Close')}>
			<Box mb={8} withRichContent>
				{t('Make_sure_you_have_a_copy_of_your_codes_1')}
			</Box>
			<CodeSnippet buttonText={hasCopied ? t('Copied') : t('Copy')} buttonDisabled={hasCopied} onClick={() => copy()} mbs={8}>
				{codesText}
			</CodeSnippet>
			<Box mb={8} withRichContent>
				{t('Make_sure_you_have_a_copy_of_your_codes_2')}
			</Box>
		</GenericModal>
	);
};

export default BackupCodesModal;
