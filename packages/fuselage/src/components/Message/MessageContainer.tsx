import ItemContent, { type ItemContentProps } from '../Item/ItemContent.js';

export type MessageContainerProps = Omit<ItemContentProps, 'is'>;

const MessageContainer = (props: MessageContainerProps) => <ItemContent {...props} />;

export default MessageContainer;
