import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import TextCopy from '../../../components/TextCopy';

type BackupCodesModalProps = {
	codes: string[];
	onClose: () => void;
};

const BackupCodesModal = ({ codes, onClose, ...props }: BackupCodesModalProps) => {
	const { t } = useTranslation();

	const codesText = useMemo(() => codes.join(' '), [codes]);

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon name='info' />
				<Modal.Title>{t('Backup_codes')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box mb={8} withRichContent>
					{t('Make_sure_you_have_a_copy_of_your_codes_1')}
				</Box>
				<TextCopy text={codesText} mb={8} />
				<Box mb={8} withRichContent>
					{t('Make_sure_you_have_a_copy_of_your_codes_2')}
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={onClose}>
						{t('Ok')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default BackupCodesModal;
