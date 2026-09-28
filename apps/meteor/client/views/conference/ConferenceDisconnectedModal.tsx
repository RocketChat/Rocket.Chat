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
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTDOWN_SECONDS = 10;

type ConferenceDisconnectedModalProps = {
	/** Stay on the call's window: the drop may have been the network rather than the reader. */
	onCancel: () => void;
	/** Leave the call and close the window, which is what the countdown arrives at on its own. */
	onClose: () => void;
};

/**
 * What to do about a call that has ended without anybody saying whether it was meant to.
 *
 * A provider that reports a disconnection without saying who caused it leaves two readings, and acting on
 * either alone is wrong: closing at once turns a blip into a departure, and staying leaves a dead frame nobody
 * can report. So the call is treated as over and the reader is given ten seconds to disagree.
 */
const ConferenceDisconnectedModal = ({ onCancel, onClose }: ConferenceDisconnectedModalProps) => {
	const { t } = useTranslation();
	const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

	// In a ref so a re-render above cannot restart the second that is already counting.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (secondsLeft <= 0) {
			onCloseRef.current();
			return undefined;
		}

		const timeout = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
		return () => clearTimeout(timeout);
	}, [secondsLeft]);

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
