import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useUserAvatarSuggestions = () => {
	const getAvatarSuggestions = useEndpoint('GET', '/v1/users.getAvatarSuggestion');

	return useQuery({
		queryKey: ['account', 'profile', 'avatar-suggestions'],
		queryFn: async () => getAvatarSuggestions(),
		select: (data) => Object.values(data.suggestions),
	});
};
