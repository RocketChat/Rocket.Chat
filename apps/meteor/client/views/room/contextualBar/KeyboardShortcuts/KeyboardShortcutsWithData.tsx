import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React from 'react';

import type { RoomToolboxContextValue } from '../../contexts/RoomToolboxContext';
import KeyboardShortcuts from './KeyboardShortcuts';

const KeyboardShortcutsWithData = ({ tabBar }: { tabBar: RoomToolboxContextValue['tabBar'] }): ReactElement => {
	const handleClose = useMutableCallback(() => tabBar?.close());
	return <KeyboardShortcuts handleClose={handleClose} />;
};

export default KeyboardShortcutsWithData;
