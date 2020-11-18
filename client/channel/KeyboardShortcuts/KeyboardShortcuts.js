import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import KeyboardShortcuts from '../../components/basic/KeyboardShortcuts';

export default React.memo(({ tabBar }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	return <KeyboardShortcuts handleClose={handleClose}/>;
});
