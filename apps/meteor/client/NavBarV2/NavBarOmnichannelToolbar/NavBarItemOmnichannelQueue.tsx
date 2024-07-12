import { NavBarItem } from '@rocket.chat/fuselage';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type NavBarItemOmnichannelQueueProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelQueue = (props: NavBarItemOmnichannelQueueProps) => {
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

export default NavBarItemOmnichannelQueue;
