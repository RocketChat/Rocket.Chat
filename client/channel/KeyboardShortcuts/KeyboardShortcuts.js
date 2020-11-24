import React from 'react';

import KeyboardShortcuts from '../../components/basic/KeyboardShortcuts';
import { useTabBarClose } from '../../views/room/providers/ToolboxProvider';

export default React.memo(() => {
	const close = useTabBarClose();
	return <KeyboardShortcuts handleClose={close}/>;
});
