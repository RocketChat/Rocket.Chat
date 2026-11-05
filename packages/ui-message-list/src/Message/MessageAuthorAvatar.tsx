import type { IMessage } from '@rocket.chat/core-typings';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useUserCard } from '@rocket.chat/ui-contexts';

import { useMessageRenderers } from './contexts/MessageRenderersContext';

export type MessageAuthorAvatarProps = {
	message: IMessage & { u: { username: string } };
};

/** The author's avatar, a pointer-only shortcut to the same user card the author's name opens. */
const MessageAuthorAvatar = ({ message }: MessageAuthorAvatarProps) => {
	const { Emoji } = useMessageRenderers();
	const { openUserCard, openUserInfo } = useUserCard();

	return (
		<MessageAvatar
			emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
			avatarUrl={message.avatar}
			username={message.u.username}
			title=''
			size='x36'
			onMouseEnter={(e) => openUserCard(e, message.u.username)}
			onClick={() => openUserInfo(message.u.username)}
			style={{ cursor: 'pointer' }}
			aria-hidden='true'
		/>
	);
};

export default MessageAuthorAvatar;
