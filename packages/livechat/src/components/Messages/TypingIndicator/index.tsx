import { memo } from 'preact/compat';

import { MessageAvatars } from '../MessageAvatars';
import { MessageBubble } from '../MessageBubble';
import { MessageContainer } from '../MessageContainer';
import { MessageContent } from '../MessageContent';
import { TypingDots } from '../TypingDots';

type TypingIndicatorProps = {
	avatarResolver: (username: string) => string | undefined;
	usernames?: string[];
	text: string;
};

export const TypingIndicator = memo(({ avatarResolver, usernames = [], text, ...containerProps }: TypingIndicatorProps) => (
	<MessageContainer {...containerProps}>
		<MessageAvatars avatarResolver={avatarResolver} usernames={usernames} />
		<MessageContent>
			<MessageBubble>
				<TypingDots text={text} />
			</MessageBubble>
		</MessageContent>
	</MessageContainer>
));
