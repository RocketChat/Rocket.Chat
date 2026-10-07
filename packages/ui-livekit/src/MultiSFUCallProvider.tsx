import { getUserDisplayName } from '@rocket.chat/core-typings';
import { useSetting, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import type { LiveKitCallProviderProps } from './LiveKitCallProvider';
import { LiveKitCallProvider } from './LiveKitCallProvider';
import type { CallPerson } from './callParticipants';
import type { CallMember } from './callRoster';
import { createCallRoster } from './callRoster';
import { useRemoteSFUConnections } from './useRemoteSFUConnections';

export type MultiSFUCallProviderProps = Omit<LiveKitCallProviderProps, 'roster' | 'remoteSFUs'> & {
	/** The conference's roster, kept current: in a federated call, it says where each member publishes and as whom. */
	members: readonly CallMember[];
};

/**
 * A LiveKit call across every SFU its members publish on. Outside a federated room that is this server's alone; in
 * one, every other homeserver with members in the call adds its own, which the call watches but never publishes on.
 */
export const MultiSFUCallProvider = ({ members, ...props }: MultiSFUCallProviderProps) => {
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const getUserAvatarPath = useUserAvatarPath();

	// From the roster rather than the participant: a federated member's identity on an SFU is a hash.
	const describe = useCallback(
		({ _id, name, username }: CallMember): CallPerson => ({
			id: _id,
			displayName: getUserDisplayName(name, username, useRealName) || username || _id,
			avatarUrl: username ? getUserAvatarPath({ username }) : getUserAvatarPath({ userId: _id }),
		}),
		[useRealName, getUserAvatarPath],
	);

	const roster = useMemo(() => createCallRoster(members, describe), [members, describe]);
	const remoteSFUs = useRemoteSFUConnections(props.callId, props.connect, members);

	return <LiveKitCallProvider {...props} roster={roster} remoteSFUs={remoteSFUs} />;
};

export default MultiSFUCallProvider;
