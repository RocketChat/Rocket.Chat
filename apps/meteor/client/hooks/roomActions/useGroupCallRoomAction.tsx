import type { IRoom } from '@rocket.chat/core-typings';
import { Button, Icon } from '@rocket.chat/fuselage';
import type { RoomToolboxActionConfig, TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMediaCallInstance, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';

// Returns true for room types that can host a group call.
const supportsGroupCalls = (room: IRoom): boolean => {
	if (room.t === 'c' || room.t === 'p') return true;
	if (room.teamMain) return true;
	if (room.t === 'd' && (room.uids?.length ?? 0) > 2) return true;
	return false;
};

const headersOf = () => ({
	'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
	'X-User-Id': localStorage.getItem('Meteor.userId') || '',
});

type ActiveCall = { _id: string; rid: string; state: 'ringing' | 'active' };

const fetchActiveCall = async (roomId: string): Promise<ActiveCall | null> => {
	const res = await fetch(`/api/v1/media-calls.activeInRoom?roomId=${encodeURIComponent(roomId)}`, {
		headers: headersOf(),
	});
	if (!res.ok) return null;
	const data = await res.json();
	return data?.call ?? null;
};

const startGroupRequest = async (roomId: string) => {
	const res = await fetch('/api/v1/media-calls.startGroup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headersOf() },
		body: JSON.stringify({ roomId }),
	});
	if (!res.ok) throw new Error((await res.text()) || 'startGroup failed');
	const data = await res.json();
	return data.call as { _id: string; rid: string };
};

const joinGroupRequest = async (callId: string) => {
	const res = await fetch('/api/v1/media-calls.joinGroup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headersOf() },
		body: JSON.stringify({ callId }),
	});
	if (!res.ok) throw new Error('joinGroup failed');
};

const leaveGroupRequest = async (callId: string) => {
	await fetch('/api/v1/media-calls.leaveGroup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headersOf() },
		body: JSON.stringify({ callId }),
	});
};

/**
 * Room-header button for group calls. State comes from:
 *  - Session (am I currently in a group call? via usePeekMediaSessionState)
 *  - React Query (is there an unjoined active call in this room?)
 *
 * Actions dispatch into Session.joinGroupCall / leaveGroupCall — no parallel
 * GroupCallProvider context.
 */
export const useGroupCallRoomAction = (): RoomToolboxActionConfig | undefined => {
	const room = useRoom();
	const livekitEnabled = useSetting<boolean>('VoIP_TeamCollab_LiveKit_Enabled', false);
	const { instance: session } = useMediaCallInstance();
	const sessionState = usePeekMediaSessionState();
	const { t } = useTranslation();
	const [busy, setBusy] = useState(false);

	const roomId = room?._id;
	const eligible = room ? supportsGroupCalls(room) : false;

	// Poll the server for active calls in this room. React Query dedupes
	// across components, so the activity component can use the same query
	// without a parallel provider.
	const { data: activeCall } = useQuery({
		queryKey: ['media-calls.activeInRoom', roomId],
		queryFn: () => (roomId ? fetchActiveCall(roomId) : Promise.resolve(null)),
		enabled: Boolean(roomId && eligible && livekitEnabled),
		refetchInterval: 5000,
	});

	// "In a call right now in this room?" — derived from session's main call.
	// usePeekMediaSessionState returns 'ongoing' when there's an active call;
	// we additionally verify it matches this room.
	const inCallHere = useMemo(() => {
		if (sessionState !== 'ongoing' || !session) return false;
		const state = session.getState(false);
		const call = state?.call;
		// rid is only set for group calls (1:1 doesn't populate it).
		return Boolean(call && (call as any).rid === roomId);
	}, [sessionState, session, roomId]);

	const hasJoinable = Boolean(activeCall) && !inCallHere;

	const action = useCallback(() => {
		if (!session || !roomId || busy) return;
		setBusy(true);
		(async () => {
			try {
				if (inCallHere) {
					const main = session.getState(false)?.call;
					if (main) {
						await leaveGroupRequest(main.callId);
					}
					session.leaveGroupCall();
					return;
				}
				let call: { _id: string; rid: string };
				if (activeCall) {
					await joinGroupRequest(activeCall._id);
					call = { _id: activeCall._id, rid: activeCall.rid };
				} else {
					call = await startGroupRequest(roomId);
				}
				session.joinGroupCall({ callId: call._id, rid: call.rid });
			} catch (err) {
				console.error('useGroupCallRoomAction', err);
				alert(`Could not start/join: ${(err as Error).message}`);
			} finally {
				setBusy(false);
			}
		})();
	}, [session, roomId, busy, inCallHere, activeCall]);

	return useMemo<RoomToolboxActionConfig | undefined>(() => {
		if (!eligible || !livekitEnabled) return undefined;
		// Once the user is in the call, the in-call view already exposes a
		// hangup control. Showing a duplicate phone-off in the room header
		// just clutters the toolbox and is the most common source of
		// "which one ends the call?" confusion.
		if (inCallHere) return undefined;

		return {
			id: 'start-group-call',
			title: (hasJoinable ? 'Join_call' : 'Start_call') as TranslationKey,
			icon: 'phone',
			featured: true,
			action,
			groups: ['channel', 'group', 'team'] as const,
			renderToolboxItem: hasJoinable
				? ({ id, className }) => (
						<Button
							key={id}
							className={className}
							primary
							small
							onClick={action}
							disabled={busy}
							style={{ display: 'inline-flex', alignItems: 'center' }}
						>
							<Icon name='phone' size='x16' mie={4} />
							{t('Join_call')}
						</Button>
					)
				: undefined,
		};
	}, [eligible, livekitEnabled, inCallHere, hasJoinable, busy, action, t]);
};
