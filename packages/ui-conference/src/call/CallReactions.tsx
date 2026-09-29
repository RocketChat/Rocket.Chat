import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

export type CallReaction = {
	id: string;
	emoji: string;
	/** Who sent it. Absent for a participant the call cannot name — the emoji still rises, unattributed. */
	name?: string;
};

/**
 * Reactions rising from the corner of the call, each carrying the name of whoever sent it.
 *
 * They used to float inside the sender's own tile, which reads well right up until the sender has no tile: a call
 * large enough to show only some of the people in it — or one where a tile is hidden for any other reason — would
 * swallow their reaction entirely. Anchoring them to the call instead of to a tile means every reaction lands
 * somewhere the whole call can see, and the name is what keeps it attributable now that position no longer says
 * who sent it.
 *
 * The corner is the bottom left: the controls own the middle of that edge, and rising through them would put an
 * emoji over the hang-up button.
 */
const layerStyles = css`
	position: absolute;
	left: 16px;
	bottom: 16px;
	// Tall enough for the whole rise, and no wider than it needs to be, so the call underneath stays clickable.
	width: 320px;
	max-width: 60%;
	height: 240px;
	pointer-events: none;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: flex-start;
	gap: 4px;
`;

const reactionStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	max-width: 100%;
	// Each one lives for the same three seconds the sender's copy does, then takes itself off the layer.
	animation: rcx-call-reaction-rise 3s ease-out forwards;

	@keyframes rcx-call-reaction-rise {
		0% {
			opacity: 0;
			transform: translateY(24px) scale(0.6);
		}
		12% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		75% {
			opacity: 1;
			transform: translateY(-120px) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-180px) scale(0.9);
		}
	}
`;

const emojiStyles = css`
	font-size: 36px;
	line-height: 1;
	text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
`;

// Over a call, which is whatever colour the cameras in it happen to be — so the name carries its own backing
// rather than relying on the surface behind it.
const nameStyles = css`
	padding: 2px 8px;
	border-radius: 12px;
	background-color: rgba(0, 0, 0, 0.55);
	color: #fff;
	font-size: 12px;
	line-height: 16px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const CallReactions = ({ reactions }: { reactions: CallReaction[] }) => {
	if (!reactions.length) {
		return null;
	}

	return (
		// Announced politely: a reaction is an aside, and one read out mid-sentence interrupts the call itself.
		<Box className={layerStyles} aria-live='polite' aria-relevant='additions'>
			{reactions.map(({ id, emoji, name }) => (
				<Box key={id} className={reactionStyles}>
					<Box is='span' className={emojiStyles}>
						{emoji}
					</Box>
					{name && (
						<Box is='span' className={nameStyles}>
							{name}
						</Box>
					)}
				</Box>
			))}
		</Box>
	);
};

export default CallReactions;
