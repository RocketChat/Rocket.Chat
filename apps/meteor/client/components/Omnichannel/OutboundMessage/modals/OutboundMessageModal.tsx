import { Modal, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';

import { OutboundMessageWizard } from '../components/OutboundMessageStepWizard/OutboundMessageWizard';

type OutboundMessageModalProps = {
	onClose: () => void;
};

export const OutboundMessageModal = ({ onClose }: OutboundMessageModalProps) => {
	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>Outbound Message</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<OutboundMessageWizard defaultValues={{}} />
			</ModalContent>
		</Modal>
	);
};
