import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { DOMAttributes, HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

const tileStyles = css`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
	cursor: pointer;
	outline: none;

	&[aria-disabled='true'] {
		cursor: default;
	}
`;

const cellStyles = css`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
`;

const thumbStyles = css`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	aspect-ratio: 16 / 9;
	border-radius: 0.25rem;
	background-color: ${Palette.surface['surface-tint'].toString()};
	box-shadow: inset 0 0 0 1px ${Palette.stroke['stroke-extra-light'].toString()};
	color: ${Palette.text['font-secondary-info'].toString()};
	transition: box-shadow 120ms ease;

	[role='row']:hover & {
		box-shadow: inset 0 0 0 1px ${Palette.stroke['stroke-medium'].toString()};
	}

	[role='row'][aria-selected='true'] & {
		box-shadow: 0 0 0 2px ${Palette.stroke['stroke-highlight'].toString()};
	}

	[role='row']:focus-visible & {
		box-shadow:
			0 0 0 2px ${Palette.stroke['stroke-highlight'].toString()},
			0 0 0 4px ${Palette.shadow['shadow-highlight'].toString()};
	}

	[role='row'][data-applying='true'] & {
		box-shadow: 0 0 0 2px ${Palette.stroke['stroke-highlight'].toString()};
	}

	[role='row'][aria-disabled='true']:not([aria-selected='true']):not([data-applying='true']) & {
		opacity: 0.5;
	}
`;

const actionStyles = css`
	position: absolute;
	inset-block-start: 0.25rem;
	inset-inline-end: 0.25rem;
	z-index: 1;
`;

const busyStyles = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.45);
	color: white;
`;

type EffectTileProps = HTMLAttributes<HTMLDivElement> & {
	thumbnail: ReactNode;
	label: string;
	note?: string;
	busy?: ReactNode;
	/** Floats on the thumbnail's top corner. */
	action?: ReactNode;
	cellProps?: DOMAttributes<HTMLElement>;
};

const EffectTile = forwardRef<HTMLDivElement, EffectTileProps>(function EffectTile(
	{ thumbnail, label, note, busy, action, cellProps, ...rowProps },
	ref,
) {
	return (
		<Box {...rowProps} is='div' ref={ref} className={tileStyles} title={label} data-applying={busy ? true : undefined}>
			<Box {...cellProps} className={cellStyles}>
				<Box className={thumbStyles}>
					{thumbnail}
					{busy && <Box className={busyStyles}>{busy}</Box>}
					{action && <Box className={actionStyles}>{action}</Box>}
				</Box>
				<Box is='span' fontScale='c1' color='default' withTruncatedText dir='auto'>
					{label}
				</Box>
				{note && (
					<Box is='span' fontScale='micro' color='hint'>
						{note}
					</Box>
				)}
			</Box>
		</Box>
	);
});

export default EffectTile;
