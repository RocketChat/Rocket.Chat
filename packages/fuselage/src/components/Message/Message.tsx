import { MessagePendingContext } from './MessageContext';
import { cx, cxx } from '../../helpers/composeClassNames';
import type { LongPressEvents } from '../../types/Attributes.contract';
import Item, { type ItemAttributes } from '../Item/Item';

export type MessageProps = ItemAttributes &
	LongPressEvents & {
		clickable?: boolean;
		/**
		 * Shows the hover surface, for rows whose content reacts to the pointer. Turn it off for rows with nothing to act on.
		 */
		hoverable?: boolean;
		sequential?: boolean;
		isSelected?: boolean;
		isEditing?: boolean;
		isPending?: boolean;
	};

function Message({
	className,
	clickable,
	hoverable = true,
	sequential,
	isSelected,
	isEditing,
	isPending,
	// The web detects no long press: the application reveals what a long press reaches, on hover and on focus
	onLongPress: _onLongPress,
	...props
}: MessageProps) {
	return (
		<MessagePendingContext.Provider value={!!isPending}>
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
		</MessagePendingContext.Provider>
	);
}

export default Message;
