import {
	Button,
	Modal,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useId, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

type OutboundMessageCloseConfirmationModalProps = {
	onConfirm(): void;
	onCancel(): void;
	onKeyDown?(e: KeyboardEvent<HTMLDivElement>): void;
};

const OutboundMessageCloseConfirmationModal = ({ onConfirm, onCancel, onKeyDown }: OutboundMessageCloseConfirmationModalProps) => {
	const { t } = useTranslation();
	const modalId = useId();

	return (
		<Modal aria-labelledby={modalId} onKeyDown={onKeyDown}>
			<ModalHeader>
				<ModalTitle id={modalId}>{t('Discard_message')}</ModalTitle>
			</ModalHeader>
			<ModalContent>
				<p aria-live='assertive'>{t('Are_you_sure_you_want_to_discard_this_outbound_message')}</p>
			</ModalContent>
			<ModalFooter justifyContent='space-between'>
				<ModalFooterAnnotation>{t('This_action_cannot_be_undone')}</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button ref={(el) => el?.focus()} secondary onClick={onCancel}>
						{t('Keep_editing')}
					</Button>
					<Button danger onClick={onConfirm}>
						{t('Discard')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default OutboundMessageCloseConfirmationModal;
