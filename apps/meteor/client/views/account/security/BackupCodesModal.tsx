import { CodeSnippet, Stack, Text } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type BackupCodesModalProps = {
	codes: string[];
	onClose: () => void;
};

const BackupCodesModal = ({ codes, onClose }: BackupCodesModalProps) => {
	const { t } = useTranslation();

	const codesText = useMemo(() => codes.join(' '), [codes]);
	const { copy, hasCopied } = useClipboard(codesText);

	return (
		<GenericModal title={t('Backup_codes')} onCancel={onClose} cancelText={t('Close')}>
			<Stack gap='x8'>
				<Text is='p'>{t('Make_sure_you_have_a_copy_of_your_codes_1')}</Text>
				<CodeSnippet buttonText={hasCopied ? t('Copied') : t('Copy')} buttonDisabled={hasCopied} onClick={() => copy()}>
					{codesText}
				</CodeSnippet>
				<Text is='p'>{t('Make_sure_you_have_a_copy_of_your_codes_2')}</Text>
			</Stack>
		</GenericModal>
	);
};

export default BackupCodesModal;
