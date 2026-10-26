import type { Keys as IconName } from '@rocket.chat/icons';
import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { BubbleButton } from './BubbleButton';
import { BubbleItem } from './BubbleItem';
import { fontFamily } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type BubbleProps = {
	secondary?: boolean;
	children: ReactNode;
	small?: boolean;
	onClick?: () => void;
	icon?: IconName;
	onDismiss?: () => void;
	contentProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;
	dismissProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'onClick'>;

const BubbleFrame = styled(View, {
	flexDirection: 'row',
	alignItems: 'center',
	overflow: 'hidden',
	flexShrink: 1,
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
});

const Bubble = ({ secondary, children, onClick, icon, onDismiss, small, contentProps, dismissProps, className, ...props }: BubbleProps) => (
	<BubbleFrame
		className={['rcx-bubble', onDismiss && 'rcx-bubble__group', small && 'rcx-bubble--small', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof BubbleFrame>)}
	>
		{onClick ? (
			<BubbleButton
				onClick={onClick}
				secondary={secondary}
				small={small}
				segment={onDismiss && 'first'}
				icon={icon}
				label={children}
				{...contentProps}
			/>
		) : (
			<BubbleItem secondary={secondary} small={small} segment={onDismiss && 'first'} icon={icon} label={children} {...contentProps} />
		)}
		{onDismiss && (
			<BubbleButton
				onClick={onDismiss}
				secondary={secondary}
				small={small}
				segment='last'
				icon='cross-small'
				{...{ 'aria-label': `Dismiss ${children}`, ...dismissProps }}
			/>
		)}
	</BubbleFrame>
);

export default withFuselageProvider(Bubble);
