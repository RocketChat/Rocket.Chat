import type { ConferenceMember, ProviderPluginControls } from '@rocket.chat/ui-conference';
import { useEffect, useMemo } from 'react';

/**
 * Has the provider list the call again whenever the server learns that somebody started or stopped waiting in
 * the lobby, and when the viewer becomes someone who can let them in.
 *
 * The provider tells its plugin when somebody arrives in the lobby but never when they leave it, so without this
 * a host would keep offering to admit somebody who was turned away, let in by another host, or gave up waiting.
 */
export const useLobbyRefresh = (members: ConferenceMember[], { features, self, actions }: ProviderPluginControls): void => {
	const lobby = useMemo(
		() =>
			members
				.flatMap(({ providerParticipants }) => providerParticipants ?? [])
				.filter(({ waiting, leftAt }) => waiting && !leftAt)
				.map(({ id }) => id)
				.sort()
				.join(),
		[members],
	);

	const canRefresh = features.has('refresh-roster') && self?.canControl === true;

	useEffect(() => {
		if (canRefresh) {
			actions.refreshRoster();
		}
	}, [lobby, canRefresh, actions]);
};
