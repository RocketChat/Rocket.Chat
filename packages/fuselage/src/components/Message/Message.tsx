import type { AllHTMLAttributes, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import Item from '../Item/Item';

export type MessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'> &
	RefAttributes<HTMLDivElement> & {
		clickable?: boolean;
		sequential?: boolean;
		className?: string;
		isSelected?: boolean;
		isEditing?: boolean;
		isPending?: boolean;
		highlight?: boolean;
	};

function Message({ className, clickable, sequential, isSelected, isEditing, isPending, highlight, ...props }: MessageProps) {
	return (
		<Item
			{...props}
			align='start'
			hoverable
			selected={isSelected}
			className={cx(
				cxx('rcx-message')({
					clickable: !!(clickable || props.onClick),
					sequential: !!sequential,
					editing: !!isEditing,
					pending: !!isPending,
					highlight: !!highlight,
				}),
				className,
			)}
		/>
	);
}

export default Message;
