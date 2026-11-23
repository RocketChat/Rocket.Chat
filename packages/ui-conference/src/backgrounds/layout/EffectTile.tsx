import { css } from '@rocket.chat/css-in-js';
import { Box, Palette, Text } from '@rocket.chat/fuselage';
import type { DOMAttributes, HTMLAttributes, ReactNode, Ref } from 'react';

const highlightRing = `0 0 0 2px ${Palette.stroke['stroke-highlight'].toString()}`;

const tileStyles = css`
	cursor: pointer;
	outline: none;

	&[aria-disabled='true'] {
		cursor: default;
	}

	&:hover [data-thumb='plain'] {
		box-shadow: inset 0 0 0 1px ${Palette.stroke['stroke-medium'].toString()};
	}

	&:focus-visible [data-thumb] {
		box-shadow:
			${highlightRing},
			0 0 0 4px ${Palette.shadow['shadow-highlight'].toString()};
	}
`;

const thumbStyles = css`
	aspect-ratio: 16 / 9;
	box-shadow: inset 0 0 0 1px ${Palette.stroke['stroke-extra-light'].toString()};
	transition: box-shadow 120ms ease;

	&[data-thumb='highlighted'] {
		box-shadow: ${highlightRing};
	}
`;

export type EffectTileProps = Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'color'> & {
	ref?: Ref<HTMLDivElement>;
	thumbnail: ReactNode;
	label: string;
	note?: string;
	selected?: boolean;
	disabled?: boolean;
	/** Covers the thumbnail while the tile's effect starts. */
	busy?: ReactNode;
	/** Floats on the thumbnail's top corner. */
	action?: ReactNode;
	cellProps?: DOMAttributes<HTMLElement>;
};

const EffectTile = ({ ref, thumbnail, label, note, selected, disabled, busy, action, cellProps, ...rowProps }: EffectTileProps) => {
	const highlighted = selected || Boolean(busy);

	return (
		<Box {...rowProps} ref={ref} className={tileStyles} minWidth={0} title={label}>
			<Box {...cellProps} display='flex' flexDirection='column' gap={4} minWidth={0}>
				<Box
					data-thumb={highlighted ? 'highlighted' : 'plain'}
					className={thumbStyles}
					position='relative'
					overflow='hidden'
					borderRadius='medium'
					backgroundColor='tint'
					color='secondary-info'
					opacity={disabled && !highlighted ? 0.5 : undefined}
				>
					<Box position='absolute' inset={0} display='flex' alignItems='center' justifyContent='center'>
						{thumbnail}
					</Box>
					{busy && (
						<Box
							position='absolute'
							inset={0}
							display='flex'
							alignItems='center'
							justifyContent='center'
							backgroundColor='overlay'
							color='pure-white'
						>
							{busy}
						</Box>
					)}
					{action && (
						<Box position='absolute' insetBlockStart={4} insetInlineEnd={4} zIndex={1}>
							{action}
						</Box>
					)}
				</Box>
				<Text is='span' fontScale='c1' color='default' truncate dir='auto'>
					{label}
				</Text>
				{note && (
					<Text is='span' fontScale='micro' color='hint'>
						{note}
					</Text>
				)}
			</Box>
		</Box>
	);
};

export default EffectTile;
