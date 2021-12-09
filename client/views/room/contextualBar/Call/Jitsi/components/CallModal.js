import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../contexts/TranslationContext';

export const CallModal = ({ handleYes, handleCancel }) => {
	const t = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Video_Conference')}</Modal.Title>
				<Modal.Close onClick={handleCancel} />
			</Modal.Header>
			<Modal.Content display='flex' flexDirection='column' alignItems='center'>
				<Icon name='modal-warning' size='x128' color='warning-500' />
				<Box fontScale='h4'>{t('Start_video_call')}</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={handleCancel}>{t('Cancel')}</Button>
					<Button primary onClick={handleYes}>
						{t('Yes')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CallModal;
