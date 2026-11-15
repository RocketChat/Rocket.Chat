import { Box, Modal, ModalClose, ModalContent, ModalHeader, ModalHeaderText, ModalTitle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { CONFERENCE_THEMED_CLASS, narrowRoomStyle } from '../lib/panelStyles';

type ConferenceThreadModalProps = {
	/** The thread itself, which is the product's and arrives built. */
	children: ReactNode;
	onClose: () => void;
};

/**
 * The frame a thread is read in when it is opened over the call.
 *
 * It holds the thread and nothing around it: the room it belongs to is already open, because this is rendered
 * *inside* the chat panel's own `RoomProvider`. The modal region it goes through sits there too, and a modal is a
 * React child of its region however far the portal moves the DOM node — which is what lets the thread consume
 * the room's context rather than opening the room a second time.
 */
const ConferenceThreadModal = ({ children, onClose }: ConferenceThreadModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();

	return (
		/* Read in the panel's theme, not the window's dark: the modal portal lands outside this tree. */
		<Modal className={CONFERENCE_THEMED_CLASS} aria-labelledby={titleId} width='x480'>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle id={titleId}>{t('Thread')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose tabIndex={-1} aria-label={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent padding={0} overflow='hidden' display='flex' flexDirection='column' height='60vh'>
				<Box className={narrowRoomStyle} display='flex' flexDirection='column' height='full'>
					{children}
				</Box>
			</ModalContent>
		</Modal>
	);
};

export default ConferenceThreadModal;
