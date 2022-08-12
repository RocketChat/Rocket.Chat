import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const WarningModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }) => {
	const t = useTranslation();
	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon color='danger' name='modal-warning' />
				<Modal.Title>{t('Are_you_sure')}</Modal.Title>
				<Modal.Close onClick={close} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{text}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={cancel || close}>
						{cancelText || t('Cancel')}
					</Button>
					<Button danger onClick={confirm}>
						{confirmText}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default WarningModal;
