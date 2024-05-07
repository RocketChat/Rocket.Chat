import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type MarketPlaceProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

export const NavBarPageMarketPlace = (props: MarketPlaceProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const handleDirectory = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/marketplace');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='store' onClick={handleDirectory} pressed={currentRoute?.includes('/marketplace')} />;
};
