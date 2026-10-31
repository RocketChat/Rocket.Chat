import type { HTMLAttributes } from 'react';

export type MessageRolesProps = HTMLAttributes<HTMLDivElement>;

const MessageRoles = (props: MessageRolesProps) => <div className='rcx-box rcx-box--full rcx-message-header__roles' {...props} />;

export default MessageRoles;
