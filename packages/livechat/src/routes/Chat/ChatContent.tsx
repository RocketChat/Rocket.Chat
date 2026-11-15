import type { EmojiData } from 'emoji-mart';
import { Suspense } from 'preact/compat';
import type { MutableRef } from 'preact/hooks';
import { useCallback, useContext, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import Picker from './Picker';
import styles from './styles.scss';
import { MessageList } from '../../components/Messages';
import { ScreenContent } from '../../components/Screen';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { createClassName } from '../../helpers/createClassName';
import { loadMoreMessages } from '../../lib/room';
import { useStore } from '../../store';

export type ChatContentProps = {
	notifyEmojiSelectRef: MutableRef<((native: string) => void) | undefined>;
	emojiPickerActive: boolean;
	onToggleEmojiPicker: () => void;
	onDismissEmojiPicker: () => void;
};

const ChatContent = ({ notifyEmojiSelectRef, emojiPickerActive, onToggleEmojiPicker, onDismissEmojiPicker }: ChatContentProps) => {
	const { theme } = useContext(ScreenContext);
	const {
		config: {
			messages: { conversationFinishedMessage },
		},
		user,
		typing,
		loading,
		dispatch,
		lastReadMessageId,
	} = useStore();

	const { t } = useTranslation();

	const messages = useStore().messages?.filter(canRenderMessage);

	const [atBottom, setAtBottom] = useState(true);

	const handleScrollTo = useCallback((region: string) => {
		if (region === MessageList.SCROLL_AT_BOTTOM) {
			setAtBottom(true);
			return;
		}

		setAtBottom(false);

		if (region === MessageList.SCROLL_AT_TOP) {
			void loadMoreMessages();
		}
	}, []);

	const handleEmojiSelect = useCallback(
		(emoji: EmojiData) => {
			onToggleEmojiPicker();
			if ('native' in emoji) {
				notifyEmojiSelectRef.current?.(emoji.native);
			}
		},
		[notifyEmojiSelectRef, onToggleEmojiPicker],
	);

	return (
		<ScreenContent nopadding>
			<div className={createClassName(styles, 'chat__messages', { atBottom, loading })}>
				<MessageList
					avatarResolver={getAvatarUrl}
					uid={user?._id}
					messages={messages}
					typingUsernames={typing}
					conversationFinishedMessage={conversationFinishedMessage || t('conversation_finished')}
					lastReadMessageId={lastReadMessageId}
					handleEmojiClick={onDismissEmojiPicker}
					dispatch={dispatch}
					hideSenderAvatar={theme?.hideGuestAvatar}
					hideReceiverAvatar={theme?.hideAgentAvatar}
					onScrollTo={handleScrollTo}
				/>
				{emojiPickerActive && (
					<Suspense fallback={null}>
						<Picker
							style={{ position: 'absolute', zIndex: 10, bottom: 0, maxWidth: '90%', left: 20, maxHeight: '90%' }}
							showPreview={false}
							showSkinTones={false}
							sheetSize={64}
							onSelect={handleEmojiSelect}
							autoFocus
						/>
					</Suspense>
				)}
			</div>
		</ScreenContent>
	);
};

export default ChatContent;
