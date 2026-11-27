import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { Icon } from '../../Icon';

export type MessageReactionActionProps = HTMLAttributes<HTMLDivElement>;

const ReactionActionFrame = styled(View, {});

const MessageReactionAction = ({ className, ...props }: MessageReactionActionProps) => (
	<ReactionActionFrame
		className={['rcx-message-reactions__reaction rcx-message-reactions__reaction--action', className].filter(Boolean).join(' ')}
		render={<div role='button' tabIndex={0} {...props} />}
	>
		<Icon name='emoji-plus' size='x16' />
	</ReactionActionFrame>
);

export default MessageReactionAction;
