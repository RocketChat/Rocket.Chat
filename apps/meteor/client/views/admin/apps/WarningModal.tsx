import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type WarningModalProps = {
	text: string;
	confirmText: string;
	close: () => void;
	cancel: () => void;
	cancelText: string;
	confirm: () => Promise<void>;
};

const WarningModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }: WarningModalProps): ReactElement => {
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
