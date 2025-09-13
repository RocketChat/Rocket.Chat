import { Box, Modal, ModalBackdrop, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import OutboundMessageCloseConfirmation from './OutboundMessageCloseConfirmation';
import OutboundMessageWizard from '../../components/OutboundMessageWizard';

export type OutboundMessageModalProps = {
	defaultValues?: ComponentProps<typeof OutboundMessageWizard>['defaultValues'];
	onClose: () => void;
};

const OutboundMessageModal = ({ defaultValues, onClose }: OutboundMessageModalProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [initialRoute] = useState(router.getLocationPathname());
	const [isClosing, setClosingConfirmation] = useState(false);

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

	const handleCloseConfirmation = (): void => {
		setClosingConfirmation(true);
	};

	return (
		<ModalBackdrop bg='transparent' onClick={(e) => e.stopPropagation()}>
			<Modal>
				<ModalHeader>
					<ModalTitle>{t('Outbound_Message')}</ModalTitle>
					{!isClosing ? <ModalClose onClick={handleCloseConfirmation} /> : null}
				</ModalHeader>
				<ModalContent pbe={16}>
					<Box display={isClosing ? 'none' : 'block'}>
						<OutboundMessageWizard defaultValues={defaultValues} onSuccess={onClose} onError={onClose} />
					</Box>

					{isClosing ? <OutboundMessageCloseConfirmation onConfirm={onClose} onCancel={() => setClosingConfirmation(false)} /> : null}
				</ModalContent>
			</Modal>
		</ModalBackdrop>
	);
};

export default OutboundMessageModal;
