import { Box, Modal, ModalClose, ModalContent, ModalHeader, ModalHeaderText, ModalTitle } from '@rocket.chat/fuselage';
import { ModalBackdrop } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import ConferenceRoomPanel from './ConferenceRoomPanel';

type ConferenceThreadModalProps = {
	rid: string;
	tmid: string;
	onClose: () => void;
};

/**
 * Renders the thread in a locally-portalled modal instead of going through `useSetModal`.
 *
 * `useSetModal` renders inside `ModalProvider`'s portal at the app root, which is outside the conference
 * page's component tree. Components like `RoomProvider` and `ChatProvider` inside `ConferenceThread`
 * crash when rendered there. Using `createPortal` directly keeps the React parent chain intact so all
 * context providers from the conference page remain available.
 */
const ConferenceThreadModal = ({ rid, tmid, onClose }: ConferenceThreadModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();

	return createPortal(
		<ModalBackdrop onDismiss={onClose}>
			<Modal aria-labelledby={titleId} width='x480'>
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
		</ModalBackdrop>,
		document.body,
	);
};

export default ConferenceThreadModal;
