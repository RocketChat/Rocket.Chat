import { isInVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import type { HandsMap } from './callDataProtocol';
import type { CallMember } from './callRoster';

export type FederatedReaction = { uid: string; emoji: string; reactionId: string };

/**
 * Hands and reactions in a federated call, as the room carries them between homeservers. The data channel only
 * reaches clients that understand Rocket.Chat's own messages, and only members of other servers need this.
 */
export type FederatedSignals = {
	/** When each member of another server in the call raised their hand, by member id. */
	hands: HandsMap;
	/** Calls back with every reaction a member of another server makes; returns how to stop. */
	subscribeReactions: (listener: (reaction: FederatedReaction) => void) => () => void;
	/** Tells the members of other servers about the reader's hand. */
	raiseHand: (raised: boolean) => void;
	/** Shows the members of other servers a reaction of the reader's. */
	react: (emoji: string) => void;
};

/** The raised hands of the members of other servers still in the call, as their roster entries say. */
export const remoteHandsOf = (members: readonly CallMember[]): HandsMap => {
	const hands: HandsMap = {};
	for (const member of members) {
		const raisedAt = member.federation?.handRaisedAt;
		if (raisedAt && !member.federation?.local && isInVideoConference(member)) {
			// Dates arrive serialized over REST.
			hands[member._id] = new Date(raisedAt).getTime();
		}
	}
	return hands;
};

export const useFederatedSignals = (callId: string, members: readonly CallMember[]): FederatedSignals => {
	const subscribeToVideoConference = useStream('video-conference');
	const postHand = useEndpoint('POST', '/v1/video-conference.hand');
	const postReaction = useEndpoint('POST', '/v1/video-conference.reaction');

	const hands = useMemo(() => remoteHandsOf(members), [members]);

	const subscribeReactions = useCallback(
		(listener: (reaction: FederatedReaction) => void) => subscribeToVideoConference(`${callId}/reaction`, listener),
		[subscribeToVideoConference, callId],
	);

	// The call goes on whether or not other servers heard: what the reader did is already on their own screen.
	const raiseHand = useCallback(
		(raised: boolean) => {
			void postHand({ callId, raised }).catch((err: unknown) => console.warn('raise-hand federation failed', err));
		},
		[postHand, callId],
	);

	const react = useCallback(
		(emoji: string) => {
			void postReaction({ callId, emoji }).catch((err: unknown) => console.warn('reaction federation failed', err));
		},
		[postReaction, callId],
	);

	return useMemo(() => ({ hands, subscribeReactions, raiseHand, react }), [hands, subscribeReactions, raiseHand, react]);
};
