import { useCallback } from 'react';

import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useEndpoint } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';

const useRoomsTab = (path) => {
	const route = useRoute('admin-rooms');
	return () => path !== 'admin-rooms' && route.push({});
};

const useUsersTab = (path) => {
	const route = useRoute('admin-users');
	return () => path !== 'admin-users' && route.push({});
};

export const useSwitchTab = (route) => ({
	users: useUsersTab(route),
	rooms: useRoomsTab(route),
});

export const useEndpointAction = (httpMethod, endpoint, params = {}, successMessage) => {
	const sendData = useEndpoint(httpMethod, endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async () => {
		try {
			const data = await sendData(params);

			if (!data.success) {
				throw new Error(data.status);
			}

			dispatchToastMessage({ type: 'success', message: successMessage });

			return data;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return { success: false };
		}
	}, [JSON.stringify(params)]);
};
