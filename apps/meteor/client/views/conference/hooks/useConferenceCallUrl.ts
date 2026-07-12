import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

// Append the current user's display name to the conference URL so the provider
// can label this participant without a separate round-trip.
export const useConferenceCallUrl = () => {
	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });

	return useMemo(
		() => (callUrl: string) => {
			if (!displayName) {
				return callUrl;
			}

			const url = new URL(callUrl, window.location.href);
			url.searchParams.set('name', displayName);
			return url.toString();
		},
		[displayName],
	);
};
