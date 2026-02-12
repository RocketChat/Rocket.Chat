import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
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
			<ModalHeader>
				<ModalIcon color='danger' name='modal-warning' />
				<ModalTitle>{t('Are_you_sure')}</ModalTitle>
				<ModalClose onClick={close} />
			</ModalHeader>
			<ModalContent fontScale='p2'>{text}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={cancel || close}>
						{cancelText || t('Cancel')}
					</Button>
					<Button danger onClick={confirm}>
						{confirmText}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default WarningModal;
