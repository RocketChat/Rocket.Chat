import type { AllHTMLAttributes } from 'react';

import type { MessageContract } from './Message.contract';
import { MessagePendingContext } from './MessageContext';
import { cx, cxx } from '../../helpers/composeClassNames';
import { pickWebPressHandlers } from '../../helpers/pickWebPressHandlers';
import type { WebProps } from '../../types/WebAttributes';
import Item from '../Item/Item';
import type { ItemInset } from '../Item/types';

export type MessageProps = WebProps<MessageContract, HTMLDivElement> &
	Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'value'> & {
		/**
		 * Adds space above and below the message, for a list of separate messages such as a panel's threads or discussions.
		 */
		insetBlock?: ItemInset;
		/**
		 * Draws a rule under the message, for a list of separate messages that needs a line between them.
		 */
		divided?: boolean;
	};

function Message({
	className,
	clickable,
	hoverable = true,
	sequential,
	isSelected,
	isEditing,
	isPending,
	onPress,
	// The web detects no long press: the application reveals what a long press reaches, on hover and on focus
	onLongPress: _onLongPress,
	onClick,
	...props
}: MessageProps) {
	return (
		<MessagePendingContext.Provider value={!!isPending}>
			<Item
				{...props}
				{...pickWebPressHandlers({ onPress, onClick })}
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
