import type { ReactNode, MouseEvent as ReactMouseEvent, AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import Item from '../../Item/Item';

export type MessageSystemProps = {
	children?: ReactNode;
	title?: string;
	isSelected?: boolean;
	onClick?: (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const MessageSystem = ({ children, title, isSelected, className, ...props }: MessageSystemProps) => (
	<Item {...props} selected={isSelected} title={title} className={cx('rcx-message-system', className)}>
		{children}
	</Item>
);

export default MessageSystem;
