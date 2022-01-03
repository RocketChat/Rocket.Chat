import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const WarningModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }) => {
	const t = useTranslation();
	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon color='danger' name='modal-warning' size={20} />
				<Modal.Title>{t('Are_you_sure')}</Modal.Title>
				<Modal.Close onClick={close} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{text}</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={cancel || close}>
						{cancelText || t('Cancel')}
					</Button>
					<Button primary danger onClick={confirm}>
						{confirmText}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default WarningModal;
