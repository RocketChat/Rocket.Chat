import type { ActiveReaction } from '@rocket.chat/ui-conference';
import { playHandRaiseChime } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { HandsMap } from './callDataProtocol';
import {
	applyHand,
	createReaction,
	dropHand,
	encodeMessage as encode,
	isHandNews,
	orderRaisedHands,
	parseMessage,
	reactionIdFor,
	sweepReactions,
} from './callDataProtocol';

/**
 * Raised hands, reactions and mute requests, carried over the room's data channel.
 *
 * The data channel does not replay, so a late joiner only learns of hands raised before they arrived because each
 * raiser rebroadcasts theirs when someone connects.
 */
export const useCallDataChannel = (room: Room, localParticipant: LocalParticipant) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [handsMap, setHandsMap] = useState<HandsMap>({});
	const [localHandRaised, setLocalHandRaised] = useState(false);
	const localRaisedAtRef = useRef(0);
	/** Whose raised hand has already been announced, so the same hand is never announced twice. */
	const announcedHandsRef = useRef<Set<string>>(new Set());

	const [activeReactions, setActiveReactions] = useState<ActiveReaction[]>([]);

	useEffect(() => {
		const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
			const msg = parseMessage(payload);
			if (!msg) return;
			if (msg.type === 'hand') {
				if (!participant) return;

				// Announced only on the way up, and only for a hand that was not already up: a hand held through a
				// reconnect, or rebroadcast because we arrived after it went up, is not news. Kept in a ref rather than
				// read from state, because deciding inside a state updater means deciding again whenever React re-runs it.
				if (isHandNews(msg, announcedHandsRef.current.has(participant.identity))) {
					announcedHandsRef.current.add(participant.identity);
					playHandRaiseChime();
				}
				if (!msg.raised) {
					announcedHandsRef.current.delete(participant.identity);
				}

				const now = Date.now();
				setHandsMap((prev) => applyHand(prev, participant.identity, msg, now));
				return;
			}
			if (msg.type === 'mute') {
				// Muting is done here, by the microphone's own client: the only place a microphone can be turned off.
				if (msg.target !== localParticipant.identity) {
					return;
				}

				void localParticipant.setMicrophoneEnabled(false).catch((err: unknown) => {
					console.warn('mute request failed', err);
				});

				// A microphone that goes quiet on its own reads as a bug, so whose decision it was is said.
				dispatchToastMessage({
					type: 'info',
					message: t('You_were_muted_by__name__', { name: participant?.name || participant?.identity || t('User') }),
				});
				return;
			}
			const reaction = createReaction(participant?.identity ?? localParticipant.identity, msg.emoji, Date.now(), msg.reactionId);
			setActiveReactions((prev) => [...prev, reaction]);
		};
		room.on(RoomEvent.DataReceived, onData);
		return () => {
			room.off(RoomEvent.DataReceived, onData);
		};
	}, [room, localParticipant, dispatchToastMessage, t]);

	// One interval rather than a timer per reaction, so a burst of them does not fan out into many timers.
	useEffect(() => {
		if (activeReactions.length === 0) return undefined;
		const handle = setInterval(() => {
			const now = Date.now();
			setActiveReactions((prev) => sweepReactions(prev, now));
		}, 1000);
		return () => clearInterval(handle);
	}, [activeReactions.length]);

	const sendReaction = useCallback(
		(emoji: string) => {
			const now = Date.now();
			const reactionId = reactionIdFor(localParticipant.identity, now);
			// Shown here at once: LiveKit does not deliver our own messages back to us.
			const reaction = createReaction(localParticipant.identity, emoji, now, reactionId);
			setActiveReactions((prev) => [...prev, reaction]);
			void localParticipant.publishData(encode({ type: 'reaction', emoji, reactionId }), { reliable: false }).catch((err) => {
				console.warn('reaction publish failed', err);
			});
		},
		[localParticipant],
	);

	useEffect(() => {
		if (!localHandRaised) return undefined;
		const rebroadcast = () => {
			void localParticipant.publishData(encode({ type: 'hand', raised: true, raisedAt: localRaisedAtRef.current, rebroadcast: true }), {
				reliable: true,
			});
		};
		room.on(RoomEvent.ParticipantConnected, rebroadcast);
		return () => {
			room.off(RoomEvent.ParticipantConnected, rebroadcast);
		};
	}, [room, localParticipant, localHandRaised]);

	const toggleHand = useCallback(() => {
		const raised = !localHandRaised;
		const raisedAt = raised ? Date.now() : 0;
		localRaisedAtRef.current = raisedAt;
		setLocalHandRaised(raised);
		if (raised) {
			playHandRaiseChime();
		}
		setHandsMap((prev) => ({ ...prev, [localParticipant.identity]: raisedAt }));
		void localParticipant.publishData(encode({ type: 'hand', raised, raisedAt }), { reliable: true }).catch((err) => {
			console.warn('raise-hand publish failed', err);
		});
	}, [localHandRaised, localParticipant]);

	const muteParticipant = useCallback(
		(participantId: string) => {
			void localParticipant.publishData(encode({ type: 'mute', target: participantId }), { reliable: true }).catch((err: unknown) => {
				console.warn('mute request publish failed', err);
			});
		},
		[localParticipant],
	);

	const raisedHands = useMemo(() => orderRaisedHands(handsMap), [handsMap]);

	// Someone who leaves leaves the queue, so the positions behind them stay right.
	useEffect(() => {
		const onDisconnect = (participant: RemoteParticipant) => {
			setHandsMap((prev) => dropHand(prev, participant.identity));
		};
		room.on(RoomEvent.ParticipantDisconnected, onDisconnect);
		return () => {
			room.off(RoomEvent.ParticipantDisconnected, onDisconnect);
		};
	}, [room]);

	return { raisedHands, localHandRaised, activeReactions, toggleHand, sendReaction, muteParticipant };
};
