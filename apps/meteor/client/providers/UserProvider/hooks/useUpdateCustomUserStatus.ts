import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { userStatuses } from '../../../lib/userStatuses';

export const useUpdateCustomUserStatus = () => {
	const notify = useStream('notify-logged');
	useEffect(() => {
		const unsubUpdate = notify('updateCustomUserStatus', (data) => {
			userStatuses.put(userStatuses.createFromCustom(data.userStatusData));
		});
		const unsubDelete = notify('deleteCustomUserStatus', (data) => {
			userStatuses.delete(data.userStatusData._id);
		});

		return () => {
			unsubUpdate();
			unsubDelete();
		};
	}, [notify]);
};
