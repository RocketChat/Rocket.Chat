import type { ReactNode, MouseEvent as ReactMouseEvent, AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import Item from '../../Item/Item';

export type MessageSystemProps = {
	children?: ReactNode;
	title?: string;
	/** Shows the selected surface, for a message picked while selecting several. */
	isSelected?: boolean;
	onClick?: (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

/**
 * A one-line record of something that happened in the room, such as a user joining or the topic changing. Compose it
 * from a `MessageLeftContainer` for the avatar and a `MessageSystemContainer`.
 */
const MessageSystem = ({ isSelected, className, ...props }: MessageSystemProps) => (
	<Item {...props} align='start' inset='lg' multiline selected={isSelected} className={cx('rcx-message-system', className)} />
);

export default MessageSystem;
