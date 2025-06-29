import { Modal, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import OutboundMessageWizard from '../../components/OutboundMessageWizard';

type OutboundMessageModalProps = {
	defaultValues?: ComponentProps<typeof OutboundMessageWizard>['defaultValues'];
	onClose: () => void;
};

const OutboundMessageModal = ({ onClose }: OutboundMessageModalProps) => {
	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>Outbound Message</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent pbe={16}>
				<OutboundMessageWizard defaultValues={{}} />
			</ModalContent>
		</Modal>
	);
};

export default OutboundMessageModal;
