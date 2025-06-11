import { Modal, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import OutboundMessageWizard from '../../components/OutboundMessageWizard';

type OutboundMessageModalProps = {
	defaultValues?: ComponentProps<typeof OutboundMessageWizard>['defaultValues'];
	onClose: () => void;
};

const OutboundMessageModal = ({ defaultValues, onClose }: OutboundMessageModalProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [initialRoute] = useState(router.getLocationPathname());

	useEffect(() => {
		// NOTE: close the modal when the route changes.
		// This is necessary to ensure that the modal closes when navigating the user to the edit contact page or other relevant routes.
		return router.subscribeToRouteChange(() => {
			if (initialRoute === router.getLocationPathname()) {
				return;
			}

			onClose();
		});
	}, [initialRoute, onClose, router]);

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Outbound_Message')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent pbe={16}>
				<OutboundMessageWizard defaultValues={defaultValues} />
			</ModalContent>
		</Modal>
	);
};

export default OutboundMessageModal;
