import { memo } from 'preact/compat';

import { MessageAvatars } from '../MessageAvatars';
import { MessageBubble } from '../MessageBubble';
import { MessageContainer } from '../MessageContainer';
import { MessageContent } from '../MessageContent';
import { TypingDots } from '../TypingDots';

export const TypingIndicator = memo(({ avatarResolver = () => null, usernames = [], text, ...containerProps }) => (
	<MessageContainer {...containerProps}>
		<MessageAvatars avatarResolver={avatarResolver} usernames={usernames} />
		<MessageContent>
			<MessageBubble>
				<TypingDots text={text} />
			</MessageBubble>
		</MessageContent>
	</MessageContainer>
));
