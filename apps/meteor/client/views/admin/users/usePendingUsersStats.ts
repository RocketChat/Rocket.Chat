import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const usePendingUsersStats = async () => {
	const getUsers = useEndpoint('GET', '/v1/users.list');
	const dispatchToastMessage = useToastMessageDispatch();

	const fields = JSON.stringify({
		name: 1,
		username: 1,
		status: 1,
		active: 1,
		lastLogin: 1,
	});

	try {
		const data = await getUsers({ fields });

		// TODO: fix currentUser type!
		return data.users.filter((currentUser: any) => currentUser.active === false || !currentUser.lastLogin);
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
	}
};
