import { Box, Modal, ModalClose, ModalContent, ModalHeader, ModalHeaderText, ModalTitle } from '@rocket.chat/fuselage';
import { lazy, useId } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceThreadChat from './ConferenceThreadChat';
import { CONFERENCE_THEMED_CLASS, narrowRoomStyle } from './panelStyles';

const ChatProvider = lazy(() => import('../room/providers/ChatProvider'));

type ConferenceThreadModalProps = {
	tmid: string;
	onClose: () => void;
};

/**
 * The thread, opened over the call.
 *
 * It renders the thread and nothing around it: the room it belongs to is already open, because this is rendered
 * *inside* the chat panel's own `RoomProvider`. The modal region it goes through sits there too, and a modal is a
 * React child of its region however far the portal moves the DOM node — which is what lets this consume the room's
 * context rather than opening the room a second time.
 */
const ConferenceThreadModal = ({ tmid, onClose }: ConferenceThreadModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();

	return (
		/* A thread is the chat panel's content one step further out, so it is read in the same theme the panel is —
		   not in the window's dark, which is what the modal portal, landing outside this tree, would otherwise
		   take. */
		<Modal className={CONFERENCE_THEMED_CLASS} aria-labelledby={titleId} width='x480'>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle id={titleId}>{t('Thread')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose tabIndex={-1} aria-label={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent padding={0} overflow='hidden' display='flex' flexDirection='column' height='60vh'>
				<Box className={narrowRoomStyle} display='flex' flexDirection='column' height='full'>
					<ChatProvider tmid={tmid}>
						<ConferenceThreadChat tmid={tmid} onEscape={onClose} />
					</ChatProvider>
				</Box>
			</ModalContent>
		</Modal>
	);
};

export default ConferenceThreadModal;
