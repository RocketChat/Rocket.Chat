import {
	Box,
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTDOWN_SECONDS = 10;

type ConferenceDisconnectedModalProps = {
	// Keep the conference open (dismiss the modal).
	onCancel: () => void;
	// Close the conference window now.
	onClose: () => void;
};

const ConferenceDisconnectedModal = ({ onCancel, onClose }: ConferenceDisconnectedModalProps) => {
	const { t } = useTranslation();
	const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

	useEffect(() => {
		if (secondsLeft <= 0) {
			onClose();
			return undefined;
		}

		const timeout = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
		return () => clearTimeout(timeout);
	}, [secondsLeft, onClose]);

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('You_have_been_disconnected')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<Box>{t('Conference_will_close_in_seconds', { count: Math.max(secondsLeft, 0) })}</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onCancel}>{t('Keep_open')}</Button>
					<Button danger onClick={onClose}>
						{t('Close')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default ConferenceDisconnectedModal;
