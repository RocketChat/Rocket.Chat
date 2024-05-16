import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type DirectoryProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

export const NavBarItemDirectoryPage = (props: DirectoryProps) => {
	const router = useRouter();
	const handleDirectory = useEffectEvent(() => {
		router.navigate('/directory');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='notebook-hashtag' onClick={handleDirectory} pressed={currentRoute?.includes('/directory')} />;
};
