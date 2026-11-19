import type { ReactNode, MouseEvent as ReactMouseEvent, AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import Item from '../../Item/Item';

export type MessageSystemProps = {
	children?: ReactNode;
	title?: string;
	isSelected?: boolean;
	onClick?: (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const MessageSystem = ({ isSelected, className, ...props }: MessageSystemProps) => (
	<Item {...props} align='start' inset='lg' multiline selected={isSelected} className={cx('rcx-message-system', className)} />
);

export default MessageSystem;
