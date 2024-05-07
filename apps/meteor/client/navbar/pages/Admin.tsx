import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type AdminProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

export const NavBarPageAdmin = (props: AdminProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const handleDirectory = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/admin');
	});
	const currentRoute = useCurrentRoutePath();

	return <NavBarItem {...props} icon='cog' onClick={handleDirectory} pressed={currentRoute?.includes('/admin')} />;
};
