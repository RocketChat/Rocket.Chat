import { NavBarItem } from '@rocket.chat/fuselage';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type OmnichannelProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

export const NavBarItemOmnichannelQueue = (props: OmnichannelProps) => {
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();

	return (
		<NavBarItem
			{...props}
			icon='queue'
			onClick={() => router.navigate('/livechat-queue')}
			pressed={currentRoute?.includes('/livechat-queue')}
		/>
	);
};
