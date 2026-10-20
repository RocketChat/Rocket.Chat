import type { AllHTMLAttributes, RefAttributes } from 'react';

import * as styles from './Message.css';
import { MessageContext } from './MessageContext';
import { prependClassName } from '../../helpers/prependClassName';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

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

const createMessage = (thread: boolean) =>
	function Message({ className, clickable, sequential, isSelected, isEditing, isPending, highlight, children, ...props }: MessageProps) {
		const isClickable = Boolean(clickable || props.onClick);

		return (
			<div
				className={`${prependClassName(
					className,
					[
						'rcx-message',
						isClickable && 'rcx-message--clickable',
						sequential && 'rcx-message--sequential',
						isSelected && 'rcx-message--selected',
						isEditing && 'rcx-message--editing',
						isPending && 'rcx-message--pending',
						highlight && 'rcx-message--highlight',
					]
						.filter(Boolean)
						.join(' '),
				)} ${styles.message({ thread, clickable: isClickable, sequential, highlight, selected: isSelected, editing: isEditing })}`}
				{...props}
			>
				<MessageContext.Provider inMessage pending={!!isPending}>
					{children}
				</MessageContext.Provider>
			</div>
		);
	};

/** `Message` with the `ThreadMessage` look; only `ThreadMessage` renders it. */
export const ThreadMessageBase = markStaticComponent(createMessage(true));

export default markStaticComponent(createMessage(false));
