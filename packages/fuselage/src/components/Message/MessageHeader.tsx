import { MessageHeaderContext } from './MessageContext';
import { cx } from '../../helpers/composeClassNames';
import ItemRow from '../Item/ItemRow';
import type { ItemPartAttributes } from '../Item/types';

export type MessageHeaderProps = ItemPartAttributes;

const MessageHeader = ({ className, ...props }: MessageHeaderProps) => (
	<MessageHeaderContext.Provider value>
		<ItemRow {...props} className={cx('rcx-message-header', className)} />
	</MessageHeaderContext.Provider>
);

export default MessageHeader;
