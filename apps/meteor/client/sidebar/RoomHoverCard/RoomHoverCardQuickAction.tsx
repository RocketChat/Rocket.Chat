import { IconButton } from '@rocket.chat/fuselage';

import type { UserInfoAction } from '../../views/room/hooks/useUserInfoActions/useUserInfoActions';

export type RoomHoverCardQuickActionProps = { action: UserInfoAction };

const RoomHoverCardQuickAction = ({ action }: RoomHoverCardQuickActionProps) => {
	const label = action.title || action.content || '';

	return (
		<IconButton mini icon={action.icon ?? 'phone'} title={label} aria-label={label} onClick={action.onClick} disabled={action.disabled} />
	);
};

export default RoomHoverCardQuickAction;
