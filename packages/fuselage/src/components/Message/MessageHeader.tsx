import { MessageHeaderContext } from './MessageContext';
import { cx } from '../../helpers/composeClassNames';
import ItemRow, { type ItemRowProps } from '../Item/ItemRow';

export type MessageHeaderProps = ItemRowProps;

const MessageHeader = ({ className, ...props }: MessageHeaderProps) => (
	<MessageHeaderContext.Provider value>
		<ItemRow {...props} className={cx('rcx-message-header', className)} />
	</MessageHeaderContext.Provider>
);

export default MessageHeader;
