import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { updateCustomUserStatus, deleteCustomUserStatus } from '../../../../app/user-status/client/lib/customUserStatus';

export const useUpdateCustomUserStatus = () => {
	const notify = useStream('notify-logged');
	useEffect(() => {
		const unsubUpdate = notify('updateCustomUserStatus', (data) => updateCustomUserStatus(data.userStatusData));
		const unsubDelete = notify('deleteCustomUserStatus', (data) => deleteCustomUserStatus(data.userStatusData));

		return () => {
			unsubUpdate();
			unsubDelete();
		};
	}, [notify]);
};
