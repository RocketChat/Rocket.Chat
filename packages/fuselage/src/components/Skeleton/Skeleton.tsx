import { styled, View } from '@tamagui/web';

import { strokeColors, surfaceColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { StylingBox } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const skeletonColor = strokeColors['stroke-extra-dark'];
const skeletonBackground = `repeat 0% 0%/100vw 100% linear-gradient(to right, ${skeletonColor}, color-mix(in srgb, ${skeletonColor}, transparent 50%) 50%, ${skeletonColor})`;

const SkeletonFrame = styled(View, {
	render: 'span',
	display: 'block',
	flex: '0 1 auto',
	outline: 'none',
	fontVariantNumeric: 'tabular-nums',
	height: '1.2em',
	animation: 'rcx-skeleton__animation 1s linear 0s infinite running',
	opacity: 0.1,
	borderRadius: toCSSValue('--rcx-border-radius-medium', borderRadius('medium')),
	background: skeletonBackground,

	variants: {
		variant: {
			text: {
				height: 'auto',
				marginBlock: 0,
				transform: 'scale(1, 0.6)',
				transformOrigin: '0 60%',
			},
			rect: {},
			circle: {
				borderRadius: toCSSValue('--rcx-border-radius-full', borderRadius('full')),
			},
		},
		// The whole shorthand, so the colour layers under the gradient whatever order the atomic rules land in
		inverted: {
			true: {
				background: `${skeletonBackground} ${String(surfaceColors['surface-light'])}`,
			},
		},
	} as const,
});

export type SkeletonProps = ElementProps<HTMLSpanElement> & {
	variant?: 'text' | 'rect' | 'circle';
	/** Whether the placeholder sits on a dark surface, such as a tooltip */
	inverted?: boolean;
	/** The size of the content the placeholder stands in for */
	width?: BoxProps['width'];
	height?: BoxProps['height'];
};

const Skeleton = ({ variant = 'text', inverted, ...props }: SkeletonProps) => (
	<StylingBox {...props}>
		<SkeletonFrame
			variant={variant}
			inverted={inverted}
			className={cx(
				cxx('rcx-skeleton')({
					text: variant === 'text',
					rect: variant === 'rect',
					circle: variant === 'circle',
					inverted: !!inverted,
				}),
			)}
		>
			{variant === 'text' && <span aria-hidden='true'>{' '}</span>}
		</SkeletonFrame>
	</StylingBox>
);

export default withFuselageProvider(Skeleton);
