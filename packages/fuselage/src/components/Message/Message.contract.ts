import type { ReactNode } from 'react';

import type { ActionContract, CommonAttributes, LongPressEvents, PressEvents } from '../../types/Attributes.contract';

export type MessageContract = CommonAttributes &
	PressEvents &
	LongPressEvents & {
		/** The parts of the message, and whatever the application reveals over the row, such as its toolbar. */
		children?: ReactNode;
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

/** A part of a message that only holds content. */
export type MessagePartContract = ActionContract & {
	children?: ReactNode;
};

export type MessageBodyContract = MessagePartContract & {
	/**
	 * Cuts the body at two lines, as in list previews.
	 */
	clamp?: 2;
};

export type MessageBlockContract = MessagePartContract & {
	fixedWidth?: boolean;
};

export type MessageHighlightContract = MessagePartContract & {
	clickable?: boolean;
	variant?: 'critical' | 'relevant' | 'other' | 'link';
};
