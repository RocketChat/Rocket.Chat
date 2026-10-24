import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontFamily, size } from '../../styleTokens';

const square = (px: number) => variantClass(`rcx-avatar--x${px}`, { width: size(`x${px}`), height: size(`x${px}`) });

const AvatarContainerFrame = styled(View, {
	render: 'figure',
	display: 'inline-flex',
	flexDirection: 'row',
	flex: '0 1 auto',
	// As a `Box` it kept the automatic minimum size, so a flex parent never shrinks it below its square
	minWidth: 'auto',
	minHeight: 'auto',
	verticalAlign: 'middle',
	margin: 0,
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outline: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',

	variants: {
		// `rcx-box--full` keeps `Margins` from styling the avatar itself; its reset matches the frame's own values
		rcx: { true: variantClass('rcx-box rcx-box--full rcx-avatar') },
		size: {
			x16: square(16),
			x18: square(18),
			x20: square(20),
			x24: square(24),
			x28: square(28),
			x32: square(32),
			x36: square(36),
			x40: square(40),
			x48: square(48),
			x124: square(124),
			x200: square(200),
			x332: square(332),
		},
	} as const,

	defaultVariants: { rcx: true, size: 'x36' },
});

export type AvatarContainerProps = {
	size?: 'x16' | 'x18' | 'x20' | 'x24' | 'x28' | 'x32' | 'x36' | 'x40' | 'x48' | 'x124' | 'x200' | 'x332';
} & HTMLAttributes<HTMLElement>;

export default asPublicFrame<AvatarContainerProps>(AvatarContainerFrame);
