import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

export const NavBarItemDirectoryPage = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
	const router = useRouter();
	const handleDirectory = useEffectEvent(() => {
		router.navigate('/directory');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='notebook-hashtag' onClick={handleDirectory} pressed={currentRoute?.includes('/directory')} />;
};
