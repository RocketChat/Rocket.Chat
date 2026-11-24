import { VisuallyHidden } from '@react-aria/visually-hidden';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import TileBadge from './TileBadge';
import ParticipantPin from '../ParticipantPin';
import { useCallPins } from '../context';
import { STRIP_THUMB_WIDTH } from '../lib/stageTiles';

// Narrower than this a tile has no room for a control beside its badges, and only marks the pin.
const NARROW_TILE = `(max-width: ${STRIP_THUMB_WIDTH - 1}px)`;

const controlStyles = css`
	opacity: 0;
	pointer-events: auto;
	transition: opacity 150ms ease;

	[data-tile]:hover &,
	[data-tile]:focus-within &,
	&[data-pinned='true'] {
		opacity: 1;
	}

	/* Nothing hovers on a touch screen. */
	@media (hover: none) {
		opacity: 1;
	}

	@container ${NARROW_TILE} {
		& {
			display: none;
		}
	}
`;

const markStyles = css`
	display: none;

	@container ${NARROW_TILE} {
		& {
			display: block;
		}
	}
`;

export type TilePinProps = {
	participantId: string;
	name: string;
};

/** A tile's pin control, shown on hover or focus and while pinned. */
const TilePin = ({ participantId, name }: TilePinProps) => {
	const { t } = useTranslation();
	const { pinnedId } = useCallPins();
	const pinned = pinnedId === participantId;

	return (
		<>
			<Box className={controlStyles} data-pinned={pinned}>
				<ParticipantPin participantId={participantId} name={name} />
			</Box>
			{pinned && (
				<Box className={markStyles}>
					<TileBadge title={t('Pinned')}>
						<Icon name='pin-filled' size='x16' />
						<VisuallyHidden>{t('Pinned')}</VisuallyHidden>
					</TileBadge>
				</Box>
			)}
		</>
	);
};

export default TilePin;
