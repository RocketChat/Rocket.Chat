import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAvatarSuggestions = () => {
	const getAvatarSuggestions = useEndpoint('GET', '/v1/users.getAvatarSuggestion');

	return useQuery(['getAvatarSuggestion'], async () => getAvatarSuggestions());
};
