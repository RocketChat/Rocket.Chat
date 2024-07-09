import { NavBarItem } from '@rocket.chat/fuselage';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type NavBarItemOmnichannelContactProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelContact = (props: NavBarItemOmnichannelContactProps) => {
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();

	return (
		<NavBarItem
			{...props}
			icon='address-book'
			onClick={() => router.navigate('/omnichannel-directory')}
			pressed={currentRoute?.includes('/omnichannel-directory')}
		/>
	);
};

export default NavBarItemOmnichannelContact;
