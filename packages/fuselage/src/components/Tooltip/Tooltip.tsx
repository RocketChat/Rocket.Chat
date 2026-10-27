import { styled, Text, View, type GetProps } from '@tamagui/web';

import { surfaceColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
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
	borderRadius: toCSSValue('--rcx-tooltip-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
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

// Physical until `usePosition` resolves placements against the writing direction;
// its coordinates are physical today, so logical offsets would flip away from the anchor in RTL.
const TooltipArrow = styled(View, {
	render: 'span',
	display: 'inline',
	position: 'absolute',
	boxSizing: 'border-box',
	width: 0,
	height: 0,
	borderWidth: 4,
	borderStyle: 'solid',
	borderTopColor: 'transparent',
	borderRightColor: 'transparent',
	borderBottomColor: darkBackgroundColor,
	borderLeftColor: darkBackgroundColor,
	borderBottomLeftRadius: 2,

	variants: {
		// One variant for side and alignment, so each placement resolves to a single class set
		placement: {
			'top': { bottom: -4, transform: 'rotate(-45deg)' },
			'top-middle': { bottom: -4, transform: 'rotate(-45deg)', left: '50%', marginLeft: -4 },
			'top-start': { bottom: -4, transform: 'rotate(-45deg)', left: 8, margin: 0 },
			'top-end': { bottom: -4, transform: 'rotate(-45deg)', left: 'initial', right: 8, margin: 0 },
			'bottom': { top: -4, transform: 'rotate(135deg)' },
			'bottom-middle': { top: -4, transform: 'rotate(135deg)', left: '50%', marginLeft: -4 },
			'bottom-start': { top: -4, transform: 'rotate(135deg)', left: 8, margin: 0 },
			'bottom-end': { top: -4, transform: 'rotate(135deg)', left: 'initial', right: 8, margin: 0 },
			'left': { top: '50%', right: -4, marginTop: -4, transform: 'rotate(-135deg)' },
			'right': { top: '50%', left: -4, marginTop: -4, transform: 'rotate(45deg)' },
		},
	} as const,
});

const isArrowDirection = (direction: string | undefined): direction is 'top' | 'bottom' | 'left' | 'right' =>
	direction === 'top' || direction === 'bottom' || direction === 'left' || direction === 'right';

const isArrowPosition = (position: string | undefined): position is 'middle' | 'start' | 'end' =>
	position === 'middle' || position === 'start' || position === 'end';

const parsePlacement = (placement: string | null | undefined) => {
	const [direction, position] = placement ? placement.split('-') : [undefined, undefined];

	if (direction === 'right' || direction === 'left') {
		return [direction, undefined];
	}

	return [direction, position];
};

export type TooltipProps = ElementProps<HTMLElement> & {
	variation?: 'dark' | 'light';
	placement?:
		'top-start' | 'top-middle' | 'top-end' | 'bottom-start' | 'bottom-middle' | 'bottom-end' | 'top' | 'left' | 'bottom' | 'right' | null;
};

function Tooltip({ variation = 'dark', placement, children, className, ...props }: TooltipProps) {
	const [direction, position] = parsePlacement(placement);

	return (
		<TooltipFrame
			light={variation === 'light'}
			{...(props as GetProps<typeof TooltipFrame>)}
			className={cx(
				'rcx-tooltip',
				direction && `rcx-tooltip--dir-${direction}`,
				position && `rcx-tooltip--pos-${position}`,
				variation === 'light' && 'rcx-tooltip--light',
				variation === 'dark' && 'rcx-tooltip--dark',
				className,
			)}
		>
			{children}
			{isArrowDirection(direction) && (
				<TooltipArrow aria-hidden placement={isArrowPosition(position) ? `${direction}-${position}` : direction} />
			)}
		</TooltipFrame>
	);
}

export default withFuselageProvider(Tooltip);
