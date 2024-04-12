import type { ReactElement } from 'react';
import React from 'react';

import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import KeyboardShortcuts from './KeyboardShortcuts';

const KeyboardShortcutsWithData = (): ReactElement => {
	const { closeTab } = useRoomToolbox();
	return <KeyboardShortcuts handleClose={closeTab} />;
};

export default KeyboardShortcutsWithData;
