import { useCallback, useRef, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import ChatContent from './ChatContent';
import ChatFooter from './ChatFooter';
import styles from './styles.scss';
import { useChatEffects } from './useChatEffects';
import { useChatSubscriptions } from './useChatSubscriptions';
import { useStableCallback } from './useStableCallback';
import { Livechat } from '../../api';
import { FilesDropTarget } from '../../components/FilesDropTarget';
import { Screen } from '../../components/Screen';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { createClassName } from '../../helpers/createClassName';
import { formatAgent } from '../../helpers/formatAgent';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { defaultRoomParams, getGreetingMessages, initRoom } from '../../lib/room';
import { useStore } from '../../store';

const useChatTitle = () => {
	const {
		config: { theme: { title = '' } = {} },
		iframe: { theme: { title: customTitle = '' } = {} },
	} = useStore();

	return customTitle || title;
};

export type ChatProps = {
	path?: string;
	default?: boolean;
};

const Chat = (_: ChatProps) => {
	useChatEffects();
	useChatSubscriptions();

	const {
		config: {
			settings: { fileUpload: uploads },
		},
		iframe: { guest = {}, defaultDepartment },
		token,
		agent,
		sound,
		user,
		room,
		dispatch,
		alerts,
		unread,
		queueInfo,
	} = useStore();

	const { t } = useTranslation();

	const inputRef = useRef<HTMLInputElement>(null);
	const notifyEmojiSelectRef = useRef<(native: string) => void>();
	const title = useChatTitle() || t('need_help');
	const messages = useStore().messages?.filter(canRenderMessage);

	const grantUser = useStableCallback(async () => {
		if (user) {
			return;
		}

		if (!guest?.department && defaultDepartment && guest) {
			guest.department = defaultDepartment;
		}

		const visitor = { token, ...guest };
		const { visitor: newUser } = await Livechat.grantVisitor({ visitor });
		dispatch({ user: newUser });
	});

	const getRoom = useStableCallback(async () => {
		const previousMessages = getGreetingMessages(messages);

		if (room) {
			return room;
		}

		dispatch({ loading: true });
		try {
			const params = defaultRoomParams();
			const newRoom = await Livechat.room(params as Parameters<typeof Livechat.room>[0]);
			dispatch({ room: newRoom, messages: previousMessages, noMoreMessages: false });
			await initRoom();

			parentCall('callback', 'chat-started');
			return newRoom;
		} catch (error: any) {
			const reason = error ? error.error : '';
			const alert = {
				id: createToken(),
				children: t('error_starting_a_new_conversation_reason', { reason }),
				error: true,
				timeout: 10000,
			};
			dispatch({ loading: false, alerts: (alerts.push(alert), alerts) });

			runCallbackEventEmitter(reason, undefined);
			throw error;
		} finally {
			dispatch({ loading: false });
		}
	});

	const queryRoomId = useCallback(async () => {
		await grantUser();
		const { _id: rid } = await getRoom();
		return rid;
	}, [grantUser, getRoom]);

	const doFileUpload = useStableCallback(async (rid: string, file: File) => {
		try {
			await Livechat.uploadFile(rid, file);
		} catch (error: any) {
			const {
				data: { reason, sizeAllowed },
			} = error;

			let message = t('fileupload_error');
			switch (reason) {
				case 'error-type-not-allowed':
					message = t('media_types_not_accepted');
					break;
				case 'error-size-not-allowed':
					message = t('file_exceeds_allowed_size_of_size', { size: sizeAllowed });
			}

			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	});

	const handleUpload = useStableCallback(async (files: (File | null)[]) => {
		if (!uploads) {
			const alert = { id: createToken(), children: t('file_upload_disabled'), error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
			return;
		}

		const rid = await queryRoomId();

		files.forEach((file) => {
			if (file) {
				void doFileUpload(rid, file);
			}
		});
	});

	const handleSoundStop = useStableCallback(async () => {
		dispatch({ sound: { ...sound, play: false } });
	});

	const [emojiPickerActive, setEmojiPickerActive] = useState(false);

	const handleAddAttachment = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleToggleEmojiPicker = useCallback(() => {
		setEmojiPickerActive((emojiPickerActive) => !emojiPickerActive);
	}, []);

	const handleDismissEmojiPicker = useCallback(() => {
		setEmojiPickerActive(false);
	}, []);

	return (
		<Screen
			title={title || t('need_help')}
			agent={formatAgent(agent)}
			queueInfo={queueInfo}
			className={createClassName(styles, 'chat')}
			unread={unread}
			onSoundStop={handleSoundStop}
		>
			<FilesDropTarget inputRef={inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={handleUpload}>
				<ChatContent
					notifyEmojiSelectRef={notifyEmojiSelectRef}
					emojiPickerActive={emojiPickerActive}
					onToggleEmojiPicker={handleToggleEmojiPicker}
					onDismissEmojiPicker={handleDismissEmojiPicker}
				/>
				<ChatFooter
					notifyEmojiSelectRef={notifyEmojiSelectRef}
					onToggleEmojiPicker={handleToggleEmojiPicker}
					onDismissEmojiPicker={handleDismissEmojiPicker}
					onAddAttachment={handleAddAttachment}
					onUpload={handleUpload}
					queryRoomId={queryRoomId}
				/>
			</FilesDropTarget>
		</Screen>
	);
};

export default Chat;
