import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { PinnedParticipantProvider, useCallState } from './context';
import { usePinnedParticipantState } from './hooks/usePinnedParticipantState';

export type CallPinScopeProps = {
	children: ReactNode;
};

/** Where a pin lives: mounted for one joined call, so leaving, reloading or the call ending forgets it. */
const CallPinScope = ({ children }: CallPinScopeProps) => {
	const { self, remoteParticipants } = useCallState();
	const presentIds = useMemo(() => new Set([self.id, ...remoteParticipants.map(({ id }) => id)]), [self.id, remoteParticipants]);
	const pin = usePinnedParticipantState(presentIds);

	return <PinnedParticipantProvider value={pin}>{children}</PinnedParticipantProvider>;
};

export default CallPinScope;
