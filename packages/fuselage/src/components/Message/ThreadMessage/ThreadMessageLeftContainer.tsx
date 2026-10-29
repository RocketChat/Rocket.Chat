import type { HTMLAttributes } from 'react';

import MessageLeftContainer from '../MessageLeftContainer';

export type ThreadMessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageLeftContainer = (props: ThreadMessageLeftContainerProps) => <MessageLeftContainer {...props} />;

export default ThreadMessageLeftContainer;
