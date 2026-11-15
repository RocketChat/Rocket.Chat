import type { ComponentProps } from 'preact';
import { useTranslation } from 'react-i18next';

import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import ModalMessage from './MessageModal';
import Modal from './Modal';

export type AlertModalProps = {
	text: string;
	buttonText?: string;
	onConfirm: () => void;
} & Omit<ComponentProps<typeof Modal>, 'open' | 'onDismiss'>;

const AlertModal = ({ text, buttonText, onConfirm, ...props }: AlertModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal open animated dismissByOverlay={false} {...props}>
			<ModalMessage>{text}</ModalMessage>
			<ButtonGroup>
				<Button secondary onClick={onConfirm}>
					{buttonText || t('ok')}
				</Button>
			</ButtonGroup>
		</Modal>
	);
};

export default AlertModal;
