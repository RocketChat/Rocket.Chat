import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { PinnedParticipantProvider, ScreenPinProvider, useCallState } from './context';
import { useFeaturedScreen } from './hooks/useFeaturedScreen';
import { usePinnedParticipantState } from './hooks/usePinnedParticipantState';

export type CallPinScopeProps = {
	children: ReactNode;
};

/**
 * Where pins live: mounted for one joined call, so leaving, reloading or the call ending forgets them. One pin holds
 * at a time, a person's or a screen's.
 */
const CallPinScope = ({ children }: CallPinScopeProps) => {
	const { self, remoteParticipants } = useCallState();
	const presentIds = useMemo(() => new Set([self.id, ...remoteParticipants.map(({ id }) => id)]), [self.id, remoteParticipants]);
	const person = usePinnedParticipantState(presentIds);
	const screen = useFeaturedScreen({ id: self.id, screenStream: self.screenStream }, remoteParticipants);

	const { pinnedId, togglePin: togglePerson } = person;
	const { pin: pinScreen, forget: forgetScreen } = screen;

	const togglePin = useCallback(
		(id: string) => {
			if (id !== pinnedId) {
				forgetScreen();
			}
			togglePerson(id);
		},
		[pinnedId, forgetScreen, togglePerson],
	);

	const pin = useCallback(
		(id: string) => {
			if (pinnedId !== null) {
				togglePerson(pinnedId);
			}
			pinScreen(id);
		},
		[pinnedId, togglePerson, pinScreen],
	);

	const personValue = useMemo(() => ({ pinnedId, togglePin }), [pinnedId, togglePin]);
	const screenValue = useMemo(() => ({ ...screen, pin }), [screen, pin]);

	return (
		<PinnedParticipantProvider value={personValue}>
			<ScreenPinProvider value={screenValue}>{children}</ScreenPinProvider>
		</PinnedParticipantProvider>
	);
};

export default CallPinScope;
