import type { AllHTMLAttributes, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import Item from '../Item/Item';

export type MessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'> &
	RefAttributes<HTMLDivElement> & {
		/** Shows the pointer cursor, for a message that does something when clicked. Passing `onClick` does the same. */
		clickable?: boolean;
		/**
		 * Shows the hover surface, for rows whose content reacts to the pointer. Turn it off for rows with nothing to act on.
		 */
		hoverable?: boolean;
		/**
		 * Marks a message that follows one from the same author and leaves out the avatar and the header: the leading
		 * column shrinks to a single line.
		 */
		sequential?: boolean;
		/** Shows the selected surface, for a message picked while selecting several. */
		isSelected?: boolean;
		/** Paints the message in the warning color while the user edits it in the composer. */
		isEditing?: boolean;
		/** Fades the body while the message is still being sent. */
		isPending?: boolean;
	};

/**
 * A message in a conversation: what someone wrote, who sent it and when, and the reactions, replies and actions on it.
 * Compose it from a `MessageLeftContainer` for the avatar, a `MessageContainer` for the header, body and blocks, and a
 * `MessageToolbarWrapper`.
 */
function Message({ className, clickable, hoverable = true, sequential, isSelected, isEditing, isPending, ...props }: MessageProps) {
	return (
		<Item
			{...props}
			align='start'
			inset='lg'
			multiline
			hoverable={hoverable}
			interactive={clickable}
			selected={isSelected}
			className={cx(
				cxx('rcx-message')({
					sequential: !!sequential,
					editing: !!isEditing,
					pending: !!isPending,
				}),
				className,
			)}
		/>
	);
}

export default Message;
