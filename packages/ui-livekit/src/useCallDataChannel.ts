import type { ActiveReaction } from '@rocket.chat/ui-conference';
import { playHandRaiseChime } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalParticipant, Participant, RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CallConnection, CallSFU } from './callConnections';
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
import type { CallPerson } from './callParticipants';

export type CallDataChannelPeers = {
	/** Names the reader's own hand and reactions. */
	selfId: string;
	/** Every connection the call listens on. Messages are only ever sent on the reader's own. */
	connections: readonly CallConnection[];
	/** Who a participant on an SFU is; undefined for whoever is not a person in the call, whose messages are ignored. */
	personOf: (sfu: CallSFU, participant: Pick<Participant, 'identity' | 'name'>) => CallPerson | undefined;
	/** The identity a person goes by on their own SFU, which is what a mute request has to name. */
	targetOf: (personId: string) => string | undefined;
};

/**
 * Raised hands, reactions and mute requests, carried over the data channel of every connection the call holds.
 *
 * The data channel does not replay, so a late joiner only learns of hands raised before they arrived because each
 * raiser rebroadcasts theirs when someone connects.
 */
export const useCallDataChannel = (
	localParticipant: LocalParticipant,
	{ selfId, connections, personOf, targetOf }: CallDataChannelPeers,
) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [handsMap, setHandsMap] = useState<HandsMap>({});
	const [localHandRaised, setLocalHandRaised] = useState(false);
	const localRaisedAtRef = useRef(0);
	/** Whose raised hand has already been announced, so the same hand is never announced twice. */
	const announcedHandsRef = useRef<Set<string>>(new Set());

	const [activeReactions, setActiveReactions] = useState<ActiveReaction[]>([]);

	useEffect(() => {
		const listen = ({ sfu, room }: CallConnection) => {
			const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
				const msg = parseMessage(payload);
				if (!msg) return;
				const sender = participant && personOf(sfu, participant);
				if (participant && !sender) return;
				if (msg.type === 'hand') {
					if (!sender) return;

					// Announced only on the way up, and only for a hand that was not already up: a hand held through a
					// reconnect, or rebroadcast because we arrived after it went up, is not news. Kept in a ref rather than
					// read from state, because deciding inside a state updater means deciding again whenever React re-runs it.
					if (isHandNews(msg, announcedHandsRef.current.has(sender.id))) {
						announcedHandsRef.current.add(sender.id);
						playHandRaiseChime();
					}
					if (!msg.raised) {
						announcedHandsRef.current.delete(sender.id);
					}

					const now = Date.now();
					setHandsMap((prev) => applyHand(prev, sender.id, msg, now));
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
						message: t('You_were_muted_by__name__', { name: sender?.displayName || t('User') }),
					});
					return;
				}
				const reaction = createReaction(sender?.id ?? selfId, msg.emoji, Date.now(), msg.reactionId);
				setActiveReactions((prev) => [...prev, reaction]);
			};
			room.on(RoomEvent.DataReceived, onData);
			return () => {
				room.off(RoomEvent.DataReceived, onData);
			};
		};

		const stops = connections.map(listen);
		return () => stops.forEach((stop) => stop());
	}, [connections, personOf, selfId, localParticipant, dispatchToastMessage, t]);

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
			const reaction = createReaction(selfId, emoji, now, reactionId);
			setActiveReactions((prev) => [...prev, reaction]);
			void localParticipant.publishData(encode({ type: 'reaction', emoji, reactionId }), { reliable: false }).catch((err) => {
				console.warn('reaction publish failed', err);
			});
		},
		[localParticipant, selfId],
	);

	useEffect(() => {
		if (!localHandRaised) return undefined;
		const rebroadcast = () => {
			void localParticipant
				.publishData(encode({ type: 'hand', raised: true, raisedAt: localRaisedAtRef.current, rebroadcast: true }), {
					reliable: true,
				})
				.catch((err) => {
					console.warn('raise-hand rebroadcast failed', err);
				});
		};
		connections.forEach(({ room }) => room.on(RoomEvent.ParticipantConnected, rebroadcast));
		return () => {
			connections.forEach(({ room }) => room.off(RoomEvent.ParticipantConnected, rebroadcast));
		};
	}, [connections, localParticipant, localHandRaised]);

	const toggleHand = useCallback(() => {
		const raised = !localHandRaised;
		const raisedAt = raised ? Date.now() : 0;
		localRaisedAtRef.current = raisedAt;
		setLocalHandRaised(raised);
		if (raised) {
			playHandRaiseChime();
		}
		setHandsMap((prev) => ({ ...prev, [selfId]: raisedAt }));
		void localParticipant.publishData(encode({ type: 'hand', raised, raisedAt }), { reliable: true }).catch((err) => {
			console.warn('raise-hand publish failed', err);
		});
	}, [localHandRaised, localParticipant, selfId]);

	const muteParticipant = useCallback(
		(personId: string) => {
			const target = targetOf(personId);
			if (!target) return;
			void localParticipant.publishData(encode({ type: 'mute', target }), { reliable: true }).catch((err: unknown) => {
				console.warn('mute request publish failed', err);
			});
		},
		[localParticipant, targetOf],
	);

	const raisedHands = useMemo(() => orderRaisedHands(handsMap), [handsMap]);

	// Someone who leaves leaves the queue, so the positions behind them stay right.
	useEffect(() => {
		const stops = connections.map(({ sfu, room }) => {
			const onDisconnect = (participant: RemoteParticipant) => {
				const person = personOf(sfu, participant);
				if (person) {
					setHandsMap((prev) => dropHand(prev, person.id));
				}
			};
			room.on(RoomEvent.ParticipantDisconnected, onDisconnect);
			return () => {
				room.off(RoomEvent.ParticipantDisconnected, onDisconnect);
			};
		});
		return () => stops.forEach((stop) => stop());
	}, [connections, personOf]);

	return { raisedHands, localHandRaised, activeReactions, toggleHand, sendReaction, muteParticipant };
};
