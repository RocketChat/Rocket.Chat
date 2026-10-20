import { styled, Text, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily, fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const darkBackgroundColor = toCSSValue('--rcx-tooltip-dark-background-color', surfaceColors['surface-dark']);
const darkTextColor = toCSSValue('--rcx-tooltip-dark-text-color', textIconColors['font-white']);

const TooltipFrame = styled(Text, {
	render: 'div',
	position: 'relative',
	display: 'inline-block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	maxWidth: 240,
	paddingBlock: 8,
	paddingInline: 12,
	userSelect: 'none',
	wordBreak: 'break-word',
	pointerEvents: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	color: darkTextColor,
	borderRadius: toCSSValue('--rcx-tooltip-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!)),
	backgroundColor: darkBackgroundColor,
	// the token's numeric `fontWeight` is wider than Tamagui's weight union
	...(fontScale('p2m') as object),

	variants: {
		light: {
			true: {
				color: toCSSValue('--rcx-tooltip-light-text-color', textIconColors['font-default']),
				backgroundColor: toCSSValue('--rcx-tooltip-light-background-color', surfaceColors['surface-neutral']),
			},
		},
	} as const,
});

const parsePlacement = (placement: string | null | undefined) => {
	const [direction, position] = placement ? placement.split('-') : [undefined, undefined];

	if (direction === 'right' || direction === 'left') {
		return [direction, undefined];
	}

	return [direction, position];
};

export type TooltipProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLElement> & {
		variation?: 'dark' | 'light';
		placement?:
			'top-start' | 'top-middle' | 'top-end' | 'bottom-start' | 'bottom-middle' | 'bottom-end' | 'top' | 'left' | 'bottom' | 'right' | null;
	};

function Tooltip({ variation = 'dark', placement, ...props }: TooltipProps) {
	const [direction, position] = parsePlacement(placement);

	const frameProps = useTamaguiBoxProps({
		'rcx-tooltip': true,
		'rcx-tooltip--dir': direction,
		'rcx-tooltip--pos': position,
		'rcx-tooltip--light': variation === 'light',
		'rcx-tooltip--dark': variation === 'dark',
		...props,
	});

	return <TooltipFrame light={variation === 'light'} {...(frameProps as GetProps<typeof TooltipFrame>)} />;
}

export default withFuselageProvider(Tooltip, { takesBoxTransforms: true });
