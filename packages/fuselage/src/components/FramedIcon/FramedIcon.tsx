import type { Keys } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes } from 'react';

import { statusColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { IconFrame } from '../Icon/Icon';

const FramedIconFrame = styled(IconFrame, {
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
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const FramedIcon = ({ info, success, warning, danger, neutral, icon, ...props }: FramedIconProps) => {
	const frameProps = useTamaguiBoxProps(
		{ ...props, fontSize: 20 },
		[
			(neutral || (!info && !success && !warning && !danger)) && 'rcx-framed-icon--neutral',
			danger && 'rcx-framed-icon--danger',
			warning && 'rcx-framed-icon--warning',
			success && 'rcx-framed-icon--success',
			info && 'rcx-framed-icon--info',
			'rcx-framed-icon',
			`rcx-icon--name-${icon}`,
			'rcx-icon',
		]
			.filter(Boolean)
			.join(' '),
	);

	// Same precedence as the stylesheet had, where the last rule declared won
	const status = (danger && 'danger') || (warning && 'warning') || (success && 'success') || (info && 'info') || undefined;

	return (
		<FramedIconFrame aria-hidden status={status} {...(frameProps as GetProps<typeof FramedIconFrame>)}>
			{nameToCharacterMapping[icon]}
		</FramedIconFrame>
	);
};

export default withFuselageProvider(FramedIcon);
