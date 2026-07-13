import { useTranslation } from 'react-i18next';

import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import ModalMessage from './MessageModal';
import type { ModalProps } from './Modal';
import Modal from './Modal';

export type ConfirmationModalProps = {
	text: string;
	confirmButtonText?: string;
	cancelButtonText?: string;
	onConfirm: () => void;
	onCancel: () => void;
} & Omit<ModalProps, 'open' | 'onDismiss'>;

const ConfirmationModal = ({ text, confirmButtonText, cancelButtonText, onConfirm, onCancel, ...props }: ConfirmationModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal open animated dismissByOverlay={false} {...props}>
			<ModalMessage>{text}</ModalMessage>
			<ButtonGroup>
				<Button outline secondary onClick={onCancel}>
					{cancelButtonText || t('no')}
				</Button>
				<Button secondary danger onClick={onConfirm}>
					{confirmButtonText || t('yes')}
				</Button>
			</ButtonGroup>
		</Modal>
	);
};

export default ConfirmationModal;
