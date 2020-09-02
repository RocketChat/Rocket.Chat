import { getUserPreference } from '../../app/utils/client';
import { useReactiveValue } from './useReactiveValue';
import { useUserId } from './useUserId';

export const useUserPreference = (key, defaultValue = undefined) => {
	const userId = useUserId();
	return useReactiveValue(() => getUserPreference(userId, key, defaultValue), [userId]);
};
