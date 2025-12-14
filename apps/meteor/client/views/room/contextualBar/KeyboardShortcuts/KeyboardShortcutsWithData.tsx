import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import KeyboardShortcuts from './KeyboardShortcuts';

const KeyboardShortcutsWithData = (): ReactElement => {
	const { closeTab } = useRoomToolbox();
	return <KeyboardShortcuts handleClose={closeTab} />;
};

export default KeyboardShortcutsWithData;
