import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React from 'react';

import type { ToolboxContextValue } from '../../contexts/ToolboxContext';
import KeyboardShortcuts from './KeyboardShortcuts';

const KeyboardShortcutsWithData = ({ tabBar }: { tabBar: ToolboxContextValue['tabBar'] }): ReactElement => {
	const handleClose = useMutableCallback(() => tabBar?.close());
	return <KeyboardShortcuts handleClose={handleClose} />;
};

export default KeyboardShortcutsWithData;
