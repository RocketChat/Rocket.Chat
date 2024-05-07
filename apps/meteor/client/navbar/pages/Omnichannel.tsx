import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type OmnichannelProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarPageOmnichannel = (props: OmnichannelProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const handleDirectory = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/omnichannel/current');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='headset' onClick={handleDirectory} pressed={currentRoute?.includes('/omnichannel')} />;
};

export default NavBarPageOmnichannel;
