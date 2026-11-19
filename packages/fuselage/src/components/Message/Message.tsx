import type { AllHTMLAttributes } from 'react';

import type { MessageContract } from './Message.contract';
import { MessagePendingContext } from './MessageContext';
import { cx, cxx } from '../../helpers/composeClassNames';
import { pickWebPressHandlers } from '../../helpers/pickWebPressHandlers';
import type { WebProps } from '../../types/WebAttributes';
import Item from '../Item/Item';

export type MessageProps = WebProps<MessageContract, HTMLDivElement> & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

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
