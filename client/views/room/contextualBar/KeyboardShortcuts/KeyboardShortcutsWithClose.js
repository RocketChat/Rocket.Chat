import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import KeyboardShortcuts from './KeyboardShortcuts';

const KeyboardShortcutsWithClose = ({ tabBar }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	return <KeyboardShortcuts handleClose={handleClose} />;
};

export default memo(KeyboardShortcutsWithClose);
