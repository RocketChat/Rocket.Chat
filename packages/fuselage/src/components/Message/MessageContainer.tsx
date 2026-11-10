import ItemContent, { type ItemContentProps } from '../Item/ItemContent';

export type MessageContainerProps = ItemContentProps;

const MessageContainer = (props: MessageContainerProps) => <ItemContent {...props} />;

export default MessageContainer;
