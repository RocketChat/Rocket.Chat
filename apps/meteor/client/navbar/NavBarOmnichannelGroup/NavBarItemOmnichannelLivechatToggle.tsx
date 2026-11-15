import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useOmnichannelLivechatToggle } from './hooks/useOmnichannelLivechatToggle';

export type NavBarItemOmnichannelLivechatToggleProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const NavBarItemOmnichannelLivechatToggle = (props: NavBarItemOmnichannelLivechatToggleProps) => {
	const { handleAvailableStatusChange, title, icon, isSuccess } = useOmnichannelLivechatToggle();

	return (
		<NavBarItem
			{...props}
			id='omnichannel-status-toggle'
			title={title}
			variant={isSuccess ? 'success' : undefined}
			icon={icon}
			onClick={handleAvailableStatusChange}
		/>
	);
};

export default NavBarItemOmnichannelLivechatToggle;
