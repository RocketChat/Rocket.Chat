import MessageLeftContainer, { type MessageLeftContainerProps } from '../MessageLeftContainer';

export type ThreadMessageLeftContainerProps = MessageLeftContainerProps;

const ThreadMessageLeftContainer = (props: ThreadMessageLeftContainerProps) => <MessageLeftContainer {...props} />;

export default ThreadMessageLeftContainer;
