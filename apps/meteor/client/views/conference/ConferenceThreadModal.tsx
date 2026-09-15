import { Box, Modal, ModalClose, ModalContent, ModalHeader, ModalHeaderText, ModalTitle } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceRoomPanel from './ConferenceRoomPanel';
import { CONFERENCE_THEMED_CLASS } from './panelStyles';

type ConferenceThreadModalProps = {
	rid: string;
	tmid: string;
	onClose: () => void;
};

/**
 * The thread, opened over the call through `useSetModal`.
 *
 * What it renders is only the modal: the backdrop, the focus trap and the portal come from the `ModalRegion`
 * the conference mounts in `ConferenceViewport`. That region is what makes `useSetModal` usable here at all —
 * the app's own region sits at the app root, outside this tree, and `ConferenceRoomPanel` below brings a
 * `RoomProvider` that needs the conference's providers around it.
 */
const ConferenceThreadModal = ({ rid, tmid, onClose }: ConferenceThreadModalProps) => {
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
				<Box display='flex' flexDirection='column' height='full'>
					<ConferenceRoomPanel rid={rid} tmid={tmid} onEscape={onClose} />
				</Box>
			</ModalContent>
		</Modal>
	);
};

export default ConferenceThreadModal;
