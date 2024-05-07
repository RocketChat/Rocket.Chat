import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type DirectoryProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

export const NavBarPageDirectory = (props: DirectoryProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const handleDirectory = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/directory');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='notebook-hashtag' onClick={handleDirectory} pressed={currentRoute?.includes('/directory')} />;
};
