import type { HTMLAttributes } from 'react';

import ItemRow from '../Item/ItemRow';

export type MessageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageHeader = (props: MessageHeaderProps) => <ItemRow className='rcx-box rcx-box--full rcx-message-header' {...props} />;

export default MessageHeader;
