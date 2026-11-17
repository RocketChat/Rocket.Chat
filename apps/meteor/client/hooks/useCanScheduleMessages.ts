import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

export const useCanScheduleMessages = (rid?: IRoom['_id']) => {
	const enabled = useSetting('Message_Scheduling_Enabled', false);
	const allowed = usePermission('schedule-message', rid);
	return enabled && allowed;
};
