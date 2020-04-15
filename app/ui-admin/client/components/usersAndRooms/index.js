import { useRoute } from '../../../../../client/contexts/RouterContext';

export * from './UsersTab';
export * from './RoomsTab';
export * from './UsersAndRooms';

const useRoomsTab = () => {
	const route = useRoute('/admin/rooms');
	return () => route.push({});
};

const useUsersTab = () => {
	const route = useRoute('/admin/users');
	return () => route.push({});
};

export const useSwitchTab = () => ({
	users: useUsersTab(),
	rooms: useRoomsTab(),
});
