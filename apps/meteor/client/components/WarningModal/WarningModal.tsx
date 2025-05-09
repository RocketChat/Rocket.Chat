import { Button, Modal } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type WarningModalProps = {
	text: ReactNode;
	confirmText: ReactNode;
	cancelText?: ReactNode;
	confirm: () => void;
	cancel?: () => void;
	close: () => void;
};

const WarningModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }: WarningModalProps): ReactElement => {
	const { t } = useTranslation();
	return (
		<Modal open {...props}>
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
