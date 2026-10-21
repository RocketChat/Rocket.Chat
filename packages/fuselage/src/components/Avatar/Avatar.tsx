import { styled, View } from '@tamagui/web';
import type { AllHTMLAttributes, CSSProperties } from 'react';

import AvatarContainer, { type AvatarContainerProps } from './AvatarContainer';
import { AvatarStackContext } from './AvatarStack';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const radius = (px: number, token: 'small' | 'medium' | 'large') => ({
	borderRadius: toCSSValue(`--rcx-avatar-border-radius-${px}`, toCSSValue(`--rcx-border-radius-${token}`, borderRadius(token))),
});

const AvatarElementFrame = styled(View, {
	context: AvatarStackContext,
	render: 'img',
	flexShrink: 1,
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	position: 'relative',
	width: '100%',
	height: '100%',

	variants: {
		size: {
			x16: radius(16, 'small'),
			x18: radius(18, 'small'),
			x20: radius(20, 'medium'),
			x24: radius(24, 'medium'),
			x28: radius(28, 'medium'),
			x32: radius(32, 'medium'),
			x36: radius(36, 'medium'),
			x40: radius(40, 'medium'),
			x48: radius(48, 'medium'),
			x124: radius(124, 'medium'),
			x200: radius(200, 'medium'),
			x332: radius(332, 'large'),
		},
		objectFit: {
			'contain': { objectFit: 'contain' },
			'cover': { objectFit: 'cover' },
			'fill': { objectFit: 'fill' },
			'none': { objectFit: 'none' },
			'scale-down': { objectFit: 'scale-down' },
		},
		stacked: {
			true: {
				borderWidth: borderWidth('default'),
				borderStyle: 'solid',
				borderColor: 'transparent',
			},
		},
		rounded: {
			true: {
				borderRadius: toCSSValue('--rcx-avatar-border-radius-rounded', toCSSValue('--rcx-border-radius-full', borderRadius('full'))),
			},
		},
	} as const,
});

const objectFits = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;

const isObjectFit = (value: unknown): value is (typeof objectFits)[number] => objectFits.includes(value as (typeof objectFits)[number]);

export type AvatarProps = AvatarContainerProps & {
	rounded?: boolean;
	objectFit?: CSSProperties['objectFit'];
	url: string;
} & Omit<AllHTMLAttributes<HTMLImageElement>, 'size'>;

const Avatar = ({ size = 'x36', rounded = false, objectFit, url, className, alt, ...props }: AvatarProps) => {
	const innerClass = [
		'rcx-avatar__element',
		size && `rcx-avatar__element--${size}`,
		rounded && 'rcx-avatar__element--rounded',
		objectFit && `rcx-avatar__element--object-fit-${objectFit}`,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<AvatarContainer size={size} className={className}>
			<AvatarElementFrame
				size={size}
				objectFit={isObjectFit(objectFit) ? objectFit : undefined}
				rounded={rounded}
				className={innerClass}
				render={<img src={url} alt={alt || ''} {...props} />}
			/>
		</AvatarContainer>
	);
};

export default withFuselageProvider(Avatar);
