import ItemContent, { type ItemContentProps } from '../Item/ItemContent';

export type MessageContainerProps = Omit<ItemContentProps, 'is'>;

/**
 * The main column of a message, holding its header, body and blocks.
 */
const MessageContainer = (props: MessageContainerProps) => <ItemContent {...props} />;

export default MessageContainer;
