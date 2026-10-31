import { NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

import { useCanScheduleMessages } from '../../hooks/useCanScheduleMessages';
import { useMyScheduledMessages } from '../../hooks/useScheduledMessages';

export type NavBarItemScheduledMessagesProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const NavBarItemScheduledMessages = (props: NavBarItemScheduledMessagesProps) => {
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();
	const canSchedule = useCanScheduleMessages();
	const { data: count = 0 } = useMyScheduledMessages({ select: (items) => items.length, enabled: canSchedule });
	const handleClick = useStableCallback(() => router.navigate('/scheduled-messages'));

	if (!canSchedule || count === 0) {
		return null;
	}

	const isCurrent = currentRoute?.includes('/scheduled-messages');

	return <NavBarItem {...props} icon='clock' onClick={handleClick} aria-current={isCurrent ? 'page' : undefined} pressed={isCurrent} />;
};

export default NavBarItemScheduledMessages;
