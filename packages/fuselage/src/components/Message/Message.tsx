import type { AriaAttributes } from 'react';

import { MessageContext } from './MessageContext';
import { cx, cxx } from '../../helpers/composeClassNames';
import Item, { type ItemAttributes } from '../Item/Item';

export type MessageProps = ItemAttributes &
	Pick<AriaAttributes, 'aria-busy' | 'aria-roledescription'> & {
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

// One shared value per state, so the provider never hands its consumers a new one
const contexts = [
	[
		{ sequential: false, pending: false },
		{ sequential: false, pending: true },
	],
	[
		{ sequential: true, pending: false },
		{ sequential: true, pending: true },
	],
] as const;

function Message({ className, clickable, hoverable = true, sequential, isSelected, isEditing, isPending, ...props }: MessageProps) {
	return (
		<MessageContext.Provider value={contexts[+!!sequential][+!!isPending]}>
			<Item
				{...props}
				align='start'
				inset='lg'
				multiline
				hoverable={hoverable}
				interactive={clickable}
				selected={isSelected}
				editing={isEditing}
				className={cx(
					cxx('rcx-message')({
						sequential: !!sequential,
						editing: !!isEditing,
						pending: !!isPending,
					}),
					className,
				)}
			/>
		</MessageContext.Provider>
	);
}

export default Message;
