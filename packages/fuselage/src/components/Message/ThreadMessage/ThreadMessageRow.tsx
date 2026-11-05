import type { HTMLAttributes } from 'react';

export type ThreadMessageRowProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageRow = (props: ThreadMessageRowProps) => <div className='rcx-box rcx-box--full rcx-message-thread__row' {...props} />;

export default ThreadMessageRow;
