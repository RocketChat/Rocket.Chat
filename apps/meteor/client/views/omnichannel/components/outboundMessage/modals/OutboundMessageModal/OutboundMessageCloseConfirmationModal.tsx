import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type OutboundMessageCloseConfirmationModalProps = {
	onConfirm(): void;
	onCancel(): void;
};

const OutboundMessageCloseConfirmationModal = ({ onConfirm, onCancel }: OutboundMessageCloseConfirmationModalProps) => {
	const { t } = useTranslation();
	const modalId = useId();

	return (
		<Modal aria-labelledby={`${modalId}-title`} aria-describedby={`${modalId}-description`} open>
			<ModalHeader>
				<ModalTitle id={`${modalId}-title`}>{t('Discard_message')}</ModalTitle>
				<ModalClose aria-label={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<p aria-live='assertive' id={`${modalId}-description`}>
					{t('Are_you_sure_you_want_to_discard_this_outbound_message')}
				</p>
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
