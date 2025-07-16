import type { ReactElement } from 'react';

import KeyboardShortcuts from './KeyboardShortcuts';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const KeyboardShortcutsWithData = (): ReactElement => {
	const { closeTab } = useRoomToolbox();
	return <KeyboardShortcuts handleClose={closeTab} />;
};

export default KeyboardShortcutsWithData;
