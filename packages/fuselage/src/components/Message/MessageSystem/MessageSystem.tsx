import type { ReactNode, MouseEvent as ReactMouseEvent, AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageSystemProps = {
	children?: ReactNode;
	title?: string;
	isSelected?: boolean;
	onClick?: (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
} & AllHTMLAttributes<HTMLDivElement>;

const MessageSystem = ({ children, title, isSelected, className, ...props }: MessageSystemProps) => (
	<div
		className={cx('rcx-box rcx-box--full rcx-message-system', isSelected && 'rcx-message-system--selected', className)}
		title={title}
		{...props}
	>
		{children}
	</div>
);

export default MessageSystem;
