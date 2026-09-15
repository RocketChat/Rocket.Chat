import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser } from '@rocket.chat/ui-contexts';

export const useConferenceCallUrl = () => {
	const user = useUser();
	const userDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	return (callUrl: string) => {
		if (!userDisplayName) {
			return callUrl;
		}
		const url = new URL(callUrl);
		url.searchParams.set('name', userDisplayName);
		return url.toString();
	};
};
