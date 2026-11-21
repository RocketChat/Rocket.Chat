import {
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	Button,
} from '@rocket.chat/fuselage';
import { ModalBackdrop } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundEffectPicker from './BackgroundEffectPicker';
import PreviewFrame from './layout/PreviewFrame';
import PreflightPreview from '../preflight/PreflightPreview';

/** Rendered in place rather than in the modal region, which is outside the preflight's media providers. */
const BackgroundEffectsModal = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();
	const titleId = useId();

	return (
		<ModalBackdrop onDismiss={onClose}>
			<Modal aria-labelledby={titleId}>
				<ModalHeader>
					<ModalTitle id={titleId}>{t('Backgrounds')}</ModalTitle>
					<ModalClose onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<PreviewFrame>
						<PreflightPreview />
					</PreviewFrame>
					<BackgroundEffectPicker />
				</ModalContent>
				<ModalFooter>
					<ModalFooterControllers>
						<Button variant='primary' onClick={onClose}>
							{t('Done')}
						</Button>
					</ModalFooterControllers>
				</ModalFooter>
			</Modal>
		</ModalBackdrop>
	);
};

export default BackgroundEffectsModal;
