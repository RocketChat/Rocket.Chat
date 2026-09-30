import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { ConferenceContextValue, ConferenceMedia, ConferencePanel } from '@rocket.chat/ui-conference';
import { useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { MediaCallRoomSection, VoiceActivity, useMediaCallView } from '@rocket.chat/ui-voip';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmbeddedConferenceCall } from './useEmbeddedConferenceCall';
import { useCallDiagnosticsContext } from '../../videoConference/livekit/CallDiagnosticsContext';
import CallDiagnosticsPanel from '../components/CallDiagnosticsPanel';

type NativeConferenceCallOptions = {
	callId: string;
	rid?: string;
	call: Pick<ConferenceContextValue['call'], 'name' | 'capabilities'>;
	/** Whether the call runs in this window — a provider with a page of its own is none of this hook's business. */
	native: boolean;
	/** Whether the provider joins without a URL at all, which is what tells the transport to connect. */
	embedded: boolean;
	panel: { active?: ConferencePanel; set: (panel: ConferencePanel | undefined) => void };
	onEnded: () => void;
};

type NativeConferenceCall = {
	media?: ConferenceMedia;
	slots: Pick<ConferenceContextValue['slots'], 'renderCall' | 'diagnostics' | 'renderMemberActivity'>;
};

/**
 * A call that runs inside this window rather than at a provider's address: joined here, and handed to the window
 * as what it knows about the call and the parts of it that only the application can draw.
 */
export const useNativeConferenceCall = ({
	callId,
	rid,
	call,
	native,
	embedded,
	panel,
	onEnded,
}: NativeConferenceCallOptions): NativeConferenceCall => {
	const { t } = useTranslation();

	// Read from where the preflight put it rather than from this window's own join: starting a call joins on the
	// *start* screen, and this window then finds the result in the cache having never asked.
	const { preferences, devices } = useCallDevicesInitialState(call.capabilities);

	// Hanging up ends what this window is for, so it reports leaving and closes — what Cancel on the preflight does.
	useEmbeddedConferenceCall({ callId, rid, embedded, preferences, devices, onEnded });

	// How the call should name and picture the viewer — it has no room membership to read that from.
	const user = useUser();
	const getUserAvatarPath = useUserAvatarPath();
	const selfDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const self = useMemo(
		() => ({ id: user?._id || 'local', displayName: selfDisplayName || '', avatarUrl: getUserAvatarPath({ userId: user?._id || '' }) }),
		[user?._id, selfDisplayName, getUserAvatarPath],
	);

	const { raisedHands, remoteParticipants, streams, sessionState, onMuteParticipant, onToggleScreenSharing } = useMediaCallView();
	const diagnostics = useCallDiagnosticsContext();

	// The reader is not one of the *remote* participants, so their own mic and screen come from the session.
	const media = useMemo((): ConferenceMedia | undefined => {
		if (!native) {
			return undefined;
		}

		const mutedMembers = new Set((remoteParticipants ?? []).filter(({ muted }) => muted).map(({ id }) => id));
		if (sessionState?.muted && user?._id) {
			mutedMembers.add(user._id);
		}

		const presenters = [
			...(streams?.localScreen?.active ? [{ name: selfDisplayName || '', avatarUrl: self.avatarUrl, isLocal: true }] : []),
			...(remoteParticipants ?? [])
				.filter(({ screenStream }) => screenStream)
				.map(({ displayName, avatarUrl }) => ({ name: displayName, avatarUrl })),
		];

		return {
			raisedHands: (raisedHands ?? []).map(({ id }) => id),
			mutedMembers,
			presenters,
			muteMember: onMuteParticipant,
			stopPresenting: onToggleScreenSharing,
		};
	}, [
		native,
		raisedHands,
		remoteParticipants,
		sessionState?.muted,
		streams?.localScreen?.active,
		user?._id,
		selfDisplayName,
		self.avatarUrl,
		onMuteParticipant,
		onToggleScreenSharing,
	]);

	const audioStreams = useMemo(() => {
		const byId = new Map((remoteParticipants ?? []).map(({ id, audioStream }) => [id, audioStream]));
		if (user?._id) {
			byId.set(user._id, streams?.localMicrophone?.stream);
		}
		return byId;
	}, [remoteParticipants, streams?.localMicrophone, user?._id]);

	const renderMemberActivity = useCallback(
		(uid: string) => <VoiceActivity stream={audioStreams.get(uid)} size={14} badge />,
		[audioStreams],
	);

	const { active, set } = panel;
	const togglePanel = useCallback((target: ConferencePanel) => set(active === target ? undefined : target), [active, set]);

	const extraMenuItems: GenericMenuItemProps[] = useMemo(
		() => [{ id: 'diagnostics', icon: 'info-circled', content: t('Connection_info'), onClick: () => togglePanel('diagnostics') }],
		[t, togglePanel],
	);

	const renderCall = useCallback(
		(hosts: { header: HTMLElement; controls: HTMLElement }) => (
			<MediaCallRoomSection
				showChat={active === 'chat'}
				onToggleChat={() => togglePanel('chat')}
				user={self}
				hideChatToggle
				actionsContainer={hosts.controls}
				headerContainer={hosts.header}
				callName={call.name}
				extraMenuItems={extraMenuItems}
			/>
		),
		[active, togglePanel, self, call.name, extraMenuItems],
	);

	// Stable, because it lands in the conference context and a new object here would redraw the whole window.
	return useMemo(
		() =>
			native
				? {
						media,
						slots: {
							renderCall,
							diagnostics: <CallDiagnosticsPanel diagnostics={diagnostics} onClose={() => set(undefined)} />,
							renderMemberActivity,
						},
					}
				: { media: undefined, slots: {} },
		[native, media, renderCall, diagnostics, set, renderMemberActivity],
	);
};
