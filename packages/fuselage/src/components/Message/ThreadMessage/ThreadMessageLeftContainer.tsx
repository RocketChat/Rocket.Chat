import MessageLeftContainer, { type MessageLeftContainerProps } from '../MessageLeftContainer';

export type ThreadMessageLeftContainerProps = MessageLeftContainerProps;

/**
 * @deprecated Use `MessageLeftContainer`.
 */
const ThreadMessageLeftContainer = (props: ThreadMessageLeftContainerProps) => <MessageLeftContainer {...props} />;

export default ThreadMessageLeftContainer;
