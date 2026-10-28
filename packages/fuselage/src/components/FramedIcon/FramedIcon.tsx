import type { Keys } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, CSSProperties } from 'react';

import { statusColors, surfaceColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, resolveFontScale, size as sizeToken, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import type { IconProps } from '../Icon/Icon';
import { IconFrame } from '../Icon/IconFrame';

const FramedIconFrame = styled(IconFrame, {
	fontSize: 'var(--rcx-icon-size, 20px)',
	padding: spacing('x4'),
	color: String(textIconColors['font-secondary-info']),
	borderRadius: toCSSValue('--rcx-border-radius-medium', borderRadius('medium')),
	backgroundColor: String(surfaceColors['surface-tint']),

	variants: {
		status: {
			info: { color: String(statusColors['status-font-on-info']) },
			success: { color: String(statusColors['status-font-on-success']) },
			warning: { color: String(statusColors['status-font-on-warning']) },
			danger: { color: String(statusColors['status-font-on-danger']) },
		},
	} as const,
});

export type FramedIconProps = {
	info?: boolean;
	success?: boolean;
	warning?: boolean;
	danger?: boolean;
	neutral?: boolean;
	icon: Keys;
	size?: IconProps['size'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color' | 'size'>;

const FramedIcon = ({ info, success, warning, danger, neutral, icon, size, className, style, ...props }: FramedIconProps) => {
	// Same precedence as the stylesheet had, where the last rule declared won
	const status = (danger && 'danger') || (warning && 'warning') || (success && 'success') || (info && 'info') || undefined;

	return (
		<FramedIconFrame
			aria-hidden
			status={status}
			style={{ ...style, '--rcx-icon-size': resolveFontScale(size)?.fontSize ?? sizeToken(size) } as CSSProperties}
			{...(props as GetProps<typeof FramedIconFrame>)}
			className={cx(
				'rcx-icon',
				`rcx-icon--name-${icon}`,
				'rcx-framed-icon',
				info && 'rcx-framed-icon--info',
				success && 'rcx-framed-icon--success',
				warning && 'rcx-framed-icon--warning',
				danger && 'rcx-framed-icon--danger',
				(neutral || (!info && !success && !warning && !danger)) && 'rcx-framed-icon--neutral',
				className,
			)}
		>
			{nameToCharacterMapping[icon]}
		</FramedIconFrame>
	);
};

export default withFuselageProvider(FramedIcon);
