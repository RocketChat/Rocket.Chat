import type { AllHTMLAttributes, RefAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageProps = AllHTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		clickable?: boolean;
		sequential?: boolean;
		className?: string;
		isSelected?: boolean;
		isEditing?: boolean;
		isPending?: boolean;
		highlight?: boolean;
	};

function Message({ className, clickable, sequential, isSelected, isEditing, isPending, highlight, ...props }: MessageProps) {
	return (
		<div
			className={prependClassName(
				className,
				[
					'rcx-message',
					(clickable || props.onClick) && 'rcx-message--clickable',
					sequential && 'rcx-message--sequential',
					isSelected && 'rcx-message--selected',
					isEditing && 'rcx-message--editing',
					isPending && 'rcx-message--pending',
					highlight && 'rcx-message--highlight',
				]
					.filter(Boolean)
					.join(' '),
			)}
			{...props}
		/>
	);
}

export default Message;
