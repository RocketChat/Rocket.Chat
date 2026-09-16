import { useCurrentModal, useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

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

	// Read through a ref so the cleanup can see what is current *then* without the effect re-running — and
	// therefore reopening the thread — every time the region's modal changes.
	const currentModal = useCurrentModal();
	const currentModalRef = useRef(currentModal);
	currentModalRef.current = currentModal;

	useEffect(() => {
		const ours = <ConferenceThreadModal tmid={tmid} onClose={onClose} />;

		setModal(ours);

		// Only if it is still ours. The region holds one modal at a time, so something else opening in it has
		// already replaced this one — and clearing then would close that instead, on the way out of a thread that
		// is no longer on screen anyway.
		return () => {
			if (currentModalRef.current === ours) {
				setModal(null);
			}
		};
	}, [tmid, onClose, setModal]);

	return null;
};

export default ConferenceThreadOverRoom;
