import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import { fontFamily, size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const square = (px: number) => ({ width: size(`x${px}`), height: size(`x${px}`) });

const AvatarContainerFrame = styled(View, {
	render: 'figure',
	display: 'inline-flex',
	flexDirection: 'row',
	flex: '0 1 auto',
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
});

export type AvatarContainerProps = {
	size?: 'x16' | 'x18' | 'x20' | 'x24' | 'x28' | 'x32' | 'x36' | 'x40' | 'x48' | 'x124' | 'x200' | 'x332';
} & HTMLAttributes<HTMLElement>;

const AvatarContainer = ({ size = 'x36', children, className, ...props }: AvatarContainerProps) => (
	<AvatarContainerFrame
		size={size}
		// `rcx-box--full` keeps `Margins` from styling the avatar itself; its reset matches the frame's own values
		className={prependClassName(className, ['rcx-box rcx-box--full rcx-avatar', size && `rcx-avatar--${size}`].filter(Boolean).join(' '))}
		render={<figure {...props} />}
	>
		{children}
	</AvatarContainerFrame>
);

export default withFuselageProvider(AvatarContainer);
