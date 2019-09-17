import { getUserPreference } from '../../app/utils/client';
import { useReactiveValue } from './useReactiveValue';
import { useUserId } from './useUserId';

export const useUserPreference = () => {
	const userId = useUserId();
	return useReactiveValue(() => getUserPreference(userId, 'unreadAlert'), [userId]);
};
