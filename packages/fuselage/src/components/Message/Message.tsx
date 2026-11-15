import type { AllHTMLAttributes, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import Item from '../Item/Item';

export type MessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'> &
	RefAttributes<HTMLDivElement> & {
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
