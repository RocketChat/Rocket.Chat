import { css } from '@rocket.chat/css-in-js';
import { Palette, borderRadius } from '@rocket.chat/fuselage';

/** Stretches the open button over the whole preview, so pressing anywhere on it opens the message. */
export const openButtonStyles = css`
	cursor: pointer;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: ${borderRadius('medium')};
	}

	&:focus-visible {
		outline: none;
	}

	/* An outline rather than a shadow: forced colours drop shadows, and the ring with them. */
	&:focus-visible::after {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: -2px;
	}
`;

/* A touch screen keeps an element hovered after a tap, which would leave the preview looking pressed. */
export const surfaceStyles = css`
	@media (hover: hover) {
		&:hover {
			background-color: ${Palette.surface['surface-hover'].toString()};
		}
	}
`;

/* Without it the browser takes a sideways drag for its own gestures and cancels the swipe. */
export const swipeStyles = css`
	touch-action: pan-y;
`;
