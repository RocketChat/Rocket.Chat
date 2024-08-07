import { Sidebar } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import useVoiceCallDialer from '../../../hooks/voiceCall/useVoiceCallDialer';

const SidebarHeaderActionHome: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const { sidebar } = useLayout();
	const showDialer = useSetting('VoIP_TeamCollab_Enabled');
	const { open: isDialerOpen, openDialer, closeDialer } = useVoiceCallDialer();

	const handleToggleDialer = useEffectEvent(() => {
		sidebar.toggle();
		isDialerOpen ? closeDialer() : openDialer();
	});

	return showDialer ? <Sidebar.TopBar.Action {...props} icon='phone' onClick={handleToggleDialer} pressed={isDialerOpen} /> : null;
};

export default SidebarHeaderActionHome;
