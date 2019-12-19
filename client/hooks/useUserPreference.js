import { getUserPreference } from '../../app/utils/client';
import { useUserId } from '../contexts/UserContext';
import { useReactiveValue } from './useReactiveValue';

export const useUserPreference = (key, defaultValue = undefined) => {
	const userId = useUserId();
	return useReactiveValue(() => getUserPreference(userId, key, defaultValue), [userId]);
};
