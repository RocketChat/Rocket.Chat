import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { BubbleButton } from './BubbleButton';
import { BubbleItem } from './BubbleItem';

export type BubbleProps = {
	/** Gives the bubble less emphasis. */
	secondary?: boolean;
	children: ReactNode;
	small?: boolean;
	/** Called when the label is pressed; with it, the label is a button. */
	onClick?: () => void;
	/** Icon shown before the label. */
	icon?: IconName;
	/** Called when the user dismisses the bubble; with it, a close button follows the label. */
	onDismiss?: () => void;
	/** Attributes for the label's element: a button with `onClick`, plain text without it. */
	contentProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;
	/** Attributes for the close button, such as an `aria-label` to replace the default "Dismiss" and the label. */
	dismissProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'onClick'>;

/**
 * Floats over a scrollable feed or a menu without pagination, to label what is in view, such as a date, or to lead
 * to content out of view, such as new messages.
 */
const Bubble = ({ secondary, children, onClick, icon, onDismiss, small, contentProps, dismissProps, className, ...props }: BubbleProps) => (
	<div
		className={['rcx-bubble', 'rcx-box', 'rcx-box--full', onDismiss && 'rcx-bubble__group', small && 'rcx-bubble--small', className]
			.filter(Boolean)
			.join(' ')}
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
				// oxlint-disable-next-line typescript/no-base-to-string -- children is a string label in practice; labelling other node types differently is a behavior change
				{...{ 'aria-label': `Dismiss ${String(children)}`, ...dismissProps }}
			/>
		)}
	</div>
);

export default Bubble;
