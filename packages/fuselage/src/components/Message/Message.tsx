import { cx, cxx } from '../../helpers/composeClassNames';
import Item, { type ItemAttributes } from '../Item/Item';
import type { ItemInset } from '../Item/types';

export type MessageProps = ItemAttributes & {
	clickable?: boolean;
	/**
	 * Shows the hover surface, for rows whose content reacts to the pointer. Turn it off for rows with nothing to act on.
	 */
	hoverable?: boolean;
	sequential?: boolean;
	isSelected?: boolean;
	isEditing?: boolean;
	isPending?: boolean;
	/**
	 * Adds space above and below the message, for a list of separate messages such as a panel's threads or discussions.
	 */
	insetBlock?: ItemInset;
	/**
	 * Draws a rule under the message, for a list of separate messages that needs a line between them.
	 */
	divided?: boolean;
};

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
