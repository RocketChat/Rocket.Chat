import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { RemoteSFUConnections } from './RemoteSFUConnections';
import type { RemoteSFUConnection } from './callConnections';
import type { CallMember } from './callRoster';
import { remoteSFUsOf } from './callRoster';

/**
 * The connections a federated call holds to other homeservers' SFUs while the reader is in it: one for each SFU
 * where members of the call publish, following the roster as members come and go.
 */
export const useRemoteSFUConnections = (
	callId: string,
	connect: boolean,
	members: readonly CallMember[],
): readonly RemoteSFUConnection[] => {
	const getFederatedToken = useEndpoint('GET', '/v1/video-conference.federatedToken');
	const dispatchToastMessage = useToastMessageDispatch();
	const [connections] = useState(() => new RemoteSFUConnections());

	const wanted = useMemo(() => (connect ? remoteSFUsOf(members) : []), [connect, members]);
	// The roster is read again whenever anything about the call changes; only a change in its SFUs is a reason to sync.
	const wantedKeys = wanted.map(({ key }) => key).join('\n');

	const sync = useStableCallback(() => {
		connections.sync(
			wanted,
			({ serverName, transport }) => getFederatedToken({ callId, serverName, transport }),
			(error) => dispatchToastMessage({ type: 'error', message: error }),
		);
	});

	useEffect(() => {
		sync();
	}, [wantedKeys, sync]);

	useEffect(() => () => connections.close(), [connections]);

	return useSyncExternalStore(connections.subscribe, connections.getSnapshot);
};
