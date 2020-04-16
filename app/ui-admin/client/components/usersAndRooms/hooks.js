import { useRoute } from '../../../../../client/contexts/RouterContext';

export * from './UsersTab';
export * from './RoomsTab';

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
