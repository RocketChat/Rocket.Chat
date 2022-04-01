import { Box, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import GenericModal from '../../components/GenericModal';
import { useTranslation } from '../../contexts/TranslationContext';
import { downloadTxtAs } from '../../lib/download';

const SaveE2EPasswordModal = ({
	randomPassword,
	passwordRevealText,
	onClose,
	onCancel,
	onConfirm,
}: {
	randomPassword: string;
	passwordRevealText: string;
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
}): ReactElement => {
	const t = useTranslation();

	const handleCopy = (): void => {
		navigator.clipboard.writeText(randomPassword);
	};

	const handleSave = (): void => {
		downloadTxtAs(randomPassword, 'password');
	};

	return (
		<GenericModal
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			cancelText={t('Do_It_Later')}
			confirmText={t('I_Saved_My_Password')}
			variant='warning'
			icon='key'
			title={t('Your_workspace_is_encrypted')}
		>
			<Box dangerouslySetInnerHTML={{ __html: passwordRevealText }} />
			<Box
				mb='x16'
				p='x8'
				pi='x16'
				border='2px solid #E4E7EA'
				display='flex'
				flexDirection='row'
				justifyContent='space-between'
				alignItems='center'
				fontWeight='500'
			>
				{randomPassword}
				<ButtonGroup>
					<Button small onClick={handleCopy}>
						<Icon name='copy' size='x20' mie='x4' />
						{t('Copy')}
					</Button>
					<Button small onClick={handleSave}>
						<Icon name='file' size='x20' mie='x4' />
						{t('Save_txt')}
					</Button>
				</ButtonGroup>
			</Box>
		</GenericModal>
	);
};

export default SaveE2EPasswordModal;
