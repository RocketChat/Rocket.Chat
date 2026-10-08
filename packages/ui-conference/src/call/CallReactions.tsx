import { css } from '@rocket.chat/css-in-js';
import { Box, Palette, borderRadius } from '@rocket.chat/fuselage';

import { REACTION_VISIBLE_MS } from './lib/reactions';

export type CallReaction = {
	id: string;
	emoji: string;
	/** Who sent it. Absent for a participant the call cannot name — the emoji still rises, unattributed. */
	name?: string;
};

/**
 * Reactions rising from the corner of the call, each carrying the name of whoever sent it — anchored to the call
 * rather than to a tile, so a sender without a tile on screen is still seen.
 *
 * Bottom left: the controls own the middle of that edge, and rising through them would cover the hang-up button.
 */
const layerStyles = css`
	position: absolute;
	left: 1rem;
	bottom: 1rem;
	// Tall enough for the whole rise, and no wider than it needs to be, so the call underneath stays clickable.
	width: 20rem;
	max-width: 60%;
	height: 15rem;
	pointer-events: none;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: flex-start;
	gap: 0.25rem;
`;

const reactionStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	max-width: 100%;
	// Each one lives for the same time the sender's copy does, then takes itself off the layer.
	animation: rcx-call-reaction-rise ${REACTION_VISIBLE_MS}ms ease-out forwards;

	@keyframes rcx-call-reaction-rise {
		0% {
			opacity: 0;
			transform: translateY(1.5rem) scale(0.6);
		}
		12% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		75% {
			opacity: 1;
			transform: translateY(-7.5rem) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-11.25rem) scale(0.9);
		}
	}
`;

const emojiStyles = css`
	font-size: 2.25rem;
	line-height: 1;
	/* Fixed, not themed: it lifts the emoji off camera frames, which are the same colours in every theme. */
	text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
`;

// Over a call, which is whatever colour the cameras in it happen to be — so the name carries its own backing
// rather than relying on the surface behind it.
const nameStyles = css`
	padding: 0.25rem 0.5rem;
	border-radius: ${borderRadius('full')};
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

// Always mounted, even empty: a live region that arrives already filled is not announced.
const CallReactions = ({ reactions }: { reactions: CallReaction[] }) => (
	// Announced politely: a reaction is an aside, and one read out mid-sentence interrupts the call itself.
	<Box className={layerStyles} aria-live='polite' aria-relevant='additions'>
		{reactions.map(({ id, emoji, name }) => (
			<Box key={id} className={reactionStyles}>
				<Box is='span' className={emojiStyles}>
					{emoji}
				</Box>
				{name && (
					<Box is='span' className={nameStyles} fontScale='c1'>
						{name}
					</Box>
				)}
			</Box>
		))}
	</Box>
);

export default CallReactions;
