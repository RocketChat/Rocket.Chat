import type { HTMLAttributes } from 'react';

import { Icon } from '../../Icon';

export type MessageReactionActionProps = HTMLAttributes<HTMLDivElement>;

const MessageReactionAction = ({ className, ...props }: MessageReactionActionProps) => (
	<div
		role='button'
		tabIndex={0}
		className={['rcx-message-reactions__reaction rcx-message-reactions__reaction--action', className].filter(Boolean).join(' ')}
		{...props}
	>
		<Icon name='emoji-plus' size='x16' />
	</div>
);

export default MessageReactionAction;
