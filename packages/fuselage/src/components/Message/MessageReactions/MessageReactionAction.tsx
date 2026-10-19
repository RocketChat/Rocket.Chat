import type { GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageReactionFrame } from './MessageReaction';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { Icon } from '../../Icon';

export type MessageReactionActionProps = HTMLAttributes<HTMLDivElement>;

const MessageReactionAction = ({ className, ...props }: MessageReactionActionProps) => (
	<MessageReactionFrame
		action
		role='button'
		tabIndex={0}
		className={['rcx-message-reactions__reaction rcx-message-reactions__reaction--action', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof MessageReactionFrame>)}
	>
		<Icon name='emoji-plus' size='x16' />
	</MessageReactionFrame>
);

export default withFuselageProvider(MessageReactionAction);
