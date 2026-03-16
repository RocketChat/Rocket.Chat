import { Modal, ModalBackdrop, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useId, useState } from 'react';
import type { KeyboardEvent, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import OutboundMessageCloseConfirmationModal from './OutboundMessageCloseConfirmationModal';
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
	const modalId = useId();

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

	const handleKeyDown = useEffectEvent((e: KeyboardEvent<HTMLDivElement>): void => {
		if (e.key !== 'Escape') {
			return;
		}

		e.stopPropagation();
		e.preventDefault();

		// Toggle confirmation visibility on Esc.
		setClosingConfirmation(!isClosing);
	});

	return (
		<ModalBackdrop bg='transparent' onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
			<Modal aria-labelledby={modalId} display={isClosing ? 'none' : undefined}>
				<ModalHeader>
					<ModalTitle id={modalId}>{t('Outbound_message')}</ModalTitle>
					<ModalClose aria-label={t('Close')} onClick={() => setClosingConfirmation(true)} />
				</ModalHeader>

				<ModalContent pbe={16} height='100%'>
					<OutboundMessageWizard defaultValues={defaultValues} onSuccess={onClose} onError={onClose} />
				</ModalContent>
			</Modal>

			{isClosing ? <OutboundMessageCloseConfirmationModal onConfirm={onClose} onCancel={() => setClosingConfirmation(false)} /> : null}
		</ModalBackdrop>
	);
};

export default OutboundMessageModal;
