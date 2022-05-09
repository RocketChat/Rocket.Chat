import { Box, Button, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import TextCopy from '../../../components/TextCopy';

type BackupCodesModalProps = {
	codes: string[];
	onClose: () => void;
};

const BackupCodesModal: FC<BackupCodesModalProps> = ({ codes, onClose, ...props }) => {
	const t = useTranslation();

	const codesText = useMemo(() => codes.join(' '), [codes]);

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon name='info' size={20} />
				<Modal.Title>{t('Backup_codes')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box mb='x8' withRichContent>
					{t('Make_sure_you_have_a_copy_of_your_codes_1')}
				</Box>
				<TextCopy text={codesText} mb='x8' />
				<Box mb='x8' withRichContent>
					{t('Make_sure_you_have_a_copy_of_your_codes_2')}
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button primary onClick={onClose}>
						{t('Ok')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default BackupCodesModal;
