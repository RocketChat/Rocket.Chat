import { styled, View } from '@tamagui/web';
import type { AllHTMLAttributes } from 'react';

import { strokeColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius } from '../../styleTokens';
import type { StylingBoxProps } from '../Box';
import { StylingBox } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const skeletonColor = strokeColors['stroke-extra-dark'];

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
	background: `repeat 0% 0%/100vw 100% linear-gradient(to right, ${skeletonColor}, color-mix(in srgb, ${skeletonColor}, transparent 50%) 50%, ${skeletonColor})`,

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
	} as const,
});

export type SkeletonProps = Omit<StylingBoxProps, 'children'> & {
	variant?: 'text' | 'rect' | 'circle';
} & AllHTMLAttributes<HTMLSpanElement>;

const Skeleton = ({ variant = 'text', ...props }: SkeletonProps) => (
	<StylingBox {...props}>
		<SkeletonFrame
			variant={variant}
			className={cx(
				cxx('rcx-skeleton')({
					text: variant === 'text',
					rect: variant === 'rect',
					circle: variant === 'circle',
				}),
			)}
		>
			{variant === 'text' && <span aria-hidden='true'>{' '}</span>}
		</SkeletonFrame>
	</StylingBox>
);

export default withFuselageProvider(Skeleton);
