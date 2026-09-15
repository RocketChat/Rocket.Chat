import { useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ConferenceThreadModal from './ConferenceThreadModal';

type ConferenceThreadOverRoomProps = {
	tmid: string;
	onClose: () => void;
};

/**
 * Puts the open thread into the room's own modal region.
 *
 * A component rather than a hook call in the panel, because it has to be *inside* the provider whose region it
 * writes to: `useSetModal` reaches the nearest one, and the panel that mounts the region sits above it.
 *
 * The region is a sibling of this, both inside the room's provider — and a modal is a React child of its region
 * however far the portal carries the DOM node. That is what lets the thread read the room from context instead of
 * opening a second copy of it, which is what it used to do.
 */
const ConferenceThreadOverRoom = ({ tmid, onClose }: ConferenceThreadOverRoomProps) => {
	const setModal = useSetModal();

	useEffect(() => {
		setModal(<ConferenceThreadModal tmid={tmid} onClose={onClose} />);

		return () => setModal(null);
	}, [tmid, onClose, setModal]);

	return null;
};

export default ConferenceThreadOverRoom;
