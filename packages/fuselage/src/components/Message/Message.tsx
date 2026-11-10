import type { AriaAttributes, ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx, cxx } from '../../helpers/composeClassNames';
import type { ActionAccessibilityAttributes, PartAttributes, WebPressHandlers } from '../../types/ElementAttributes';
import Item from '../Item/Item';

export type MessageProps = PartAttributes<HTMLDivElement> &
	ActionAccessibilityAttributes &
	Pick<WebPressHandlers<HTMLDivElement>, 'onClick' | 'onKeyDown'> &
	Pick<AriaAttributes, 'aria-roledescription' | 'aria-busy'> & {
		'children'?: ReactNode;
		'clickable'?: boolean;
		/**
		 * Shows the hover surface, for rows whose content reacts to the pointer. Turn it off for rows with nothing to act on.
		 */
		'hoverable'?: boolean;
		'sequential'?: boolean;
		'isSelected'?: boolean;
		'isEditing'?: boolean;
		'isPending'?: boolean;
		// What the app's message list reads back from a row
		'data-id'?: string;
		'data-mid'?: string;
		'data-tmid'?: string;
		'data-unread'?: boolean;
		'data-sequential'?: boolean;
		'data-own'?: boolean;
	};

function Message(props: MessageProps) {
	const { className, children, clickable, hoverable = true, sequential, isSelected, isEditing, isPending } = props;

	return (
		<Item
			{...ariaAndDataAttributes(props)}
			ref={props.ref}
			id={props.id}
			title={props.title}
			role={props.role}
			tabIndex={props.tabIndex}
			onClick={props.onClick}
			onKeyDown={props.onKeyDown}
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
		>
			{children}
		</Item>
	);
}

export default Message;
