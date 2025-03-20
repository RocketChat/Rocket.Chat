import type { ReactElement } from 'react';

import SidebarFooterDefault from './SidebarFooterDefault';
import { VoipFooter } from './voip';
import { useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';

const SidebarFooter = (): ReactElement => {
	const isCallEnabled = useIsCallEnabled();
	const ready = useIsCallReady();

	if (isCallEnabled && ready) {
		return <VoipFooter />;
	}

	return <SidebarFooterDefault />;
};

export default SidebarFooter;
