import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes } from 'react';

import { CardContext } from './CardFrames';
import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const cardBackgroundColor = toCSSValue('--rcx-card-background-color', surfaceColors['surface-light']);
const cardHoverBackgroundColor = String(surfaceColors['surface-hover']);

const CardFrame = styled(View, {
	context: CardContext,
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	color: toCSSValue('--rcx-card-color', textIconColors['font-default']),
	borderRadius: toCSSValue('--rcx-border-radius-large', borderRadius('large')),
	backgroundColor: cardBackgroundColor,

	variants: {
		horizontal: {
			true: {
				alignItems: 'center',
				padding: spacing('x12'),
				gap: spacing('x16'),
			},
			false: {
				flexDirection: 'column',
				padding: spacing('x20'),
				gap: spacing('x24'),
			},
		},
		wrap: {
			true: {
				flexWrap: 'wrap',
			},
		},
		hero: {
			true: {
				padding: spacing('x28'),
			},
		},
		clickable: {
			true: {
				cursor: { hover: 'pointer', focus: 'pointer' },
				outlineWidth: { hover: 0, focus: 0 },
				backgroundColor: { default: cardBackgroundColor, hover: cardHoverBackgroundColor, focus: cardHoverBackgroundColor },
			},
		},
	} as const,
});

export type CardProps = {
	horizontal?: boolean;
	hero?: boolean;
	clickable?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const Card = ({ horizontal, hero, clickable, ...props }: CardProps) => {
	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('sm');

	const cardProps = useTamaguiBoxProps({
		'rcx-card': true,
		'rcx-card__horizontal': horizontal,
		'rcx-card__vertical': !horizontal,
		'rcx-card__hero': hero,
		'rcx-card__horizontal--wrap': horizontal && isMobile,
		'rcx-card__clickable': clickable,
		...props,
	});

	return (
		<CardFrame
			horizontal={!!horizontal}
			wrap={!!horizontal && isMobile}
			hero={hero}
			clickable={clickable}
			{...(cardProps as GetProps<typeof CardFrame>)}
		/>
	);
};

export default withFuselageProvider(Card, { takesBoxTransforms: true });
