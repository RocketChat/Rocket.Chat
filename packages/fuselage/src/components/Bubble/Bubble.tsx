import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { BubbleButton } from './BubbleButton';
import { BubbleItem } from './BubbleItem';
import { prependClassName } from '../../helpers/prependClassName';

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

const Bubble = ({ secondary, children, onClick, icon, onDismiss, small, contentProps, dismissProps, className, ...props }: BubbleProps) => (
	<div
		className={prependClassName(
			className,
			['rcx-bubble', 'rcx-box', 'rcx-box--full', onDismiss && 'rcx-bubble__group', small && 'rcx-bubble--small'].filter(Boolean).join(' '),
		)}
		{...props}
	>
		{onClick ? (
			<BubbleButton onClick={onClick} secondary={secondary} icon={icon} label={children} {...contentProps} />
		) : (
			<BubbleItem secondary={secondary} icon={icon} label={children} {...contentProps} />
		)}
		{onDismiss && (
			<BubbleButton
				onClick={onDismiss}
				secondary={secondary}
				icon='cross-small'
				{...{ 'aria-label': `Dismiss ${children}`, ...dismissProps }}
			/>
		)}
	</div>
);

export default Bubble;
