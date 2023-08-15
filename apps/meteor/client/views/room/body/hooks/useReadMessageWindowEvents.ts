import { useEffect } from 'react';

import { readMessage } from '../../../../../app/ui-utils/client';
import { useRoom } from '../../contexts/RoomContext';

export function useReadMessageWindowEvents() {
	const { _id: rid } = useRoom();

	useEffect(() => {
		const handleWindowBlur = () => {
			readMessage.disable();
		};

		const handleWindowFocus = () => {
			readMessage.enable();
			readMessage.read();
		};

		const handleWindowTouchEnd = () => {
			readMessage.enable();
		};

		const handleWindowKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				readMessage.readNow(rid);
				readMessage.refreshUnreadMark(rid);
			}
		};

		window.addEventListener('blur', handleWindowBlur);
		window.addEventListener('focus', handleWindowFocus);
		window.addEventListener('touchend', handleWindowTouchEnd);
		window.addEventListener('keyup', handleWindowKeyUp);

		return () => {
			window.removeEventListener('blur', handleWindowBlur);
			window.removeEventListener('focus', handleWindowFocus);
			window.removeEventListener('touchend', handleWindowTouchEnd);
			window.removeEventListener('keyup', handleWindowKeyUp);
		};
	}, [rid]);
}
