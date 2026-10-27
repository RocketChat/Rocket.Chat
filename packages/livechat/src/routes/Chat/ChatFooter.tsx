import type { MutableRef } from 'preact/hooks';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { useStableCallback } from './useStableCallback';
import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Composer, ComposerAction, ComposerActions } from '../../components/Composer';
import { FooterOptions, CharCounter } from '../../components/Footer';
import { MenuGroup, MenuItem } from '../../components/Menu';
import { ModalManager } from '../../components/Modal';
import { ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { debounce } from '../../helpers/debounce';
import { throttle } from '../../helpers/throttle';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import PlusIcon from '../../icons/plus.svg';
import RemoveIcon from '../../icons/remove.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';
import { loadConfig } from '../../lib/main';
import { createToken } from '../../lib/random';
import { useStore } from '../../store';

const startTyping = throttle(async ({ rid, username }: { rid: string; username: string }) => {
	await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
	stopTypingDebounced({ rid, username });
}, 4500);

const stopTyping = ({ rid, username }: { rid: string; username: string }) => Livechat.notifyVisitorActivity(rid, username, []);

const stopTypingDebounced = debounce(stopTyping, 5000);

export type ChatFooterProps = {
	notifyEmojiSelectRef: MutableRef<((native: string) => void) | undefined>;
	onToggleEmojiPicker: () => void;
	onDismissEmojiPicker: () => void;
	onAddAttachment: () => void;
	onUpload: (files: (File | null)[]) => Promise<void>;
	queryRoomId: () => Promise<string>;
};

const ChatFooter = ({
	notifyEmojiSelectRef,
	onToggleEmojiPicker,
	onDismissEmojiPicker,
	onAddAttachment,
	onUpload,
	queryRoomId,
}: ChatFooterProps) => {
	const {
		config: {
			settings: {
				fileUpload,
				allowSwitchingDepartments,
				forceAcceptDataProcessingConsent,
				showConnecting,
				registrationForm,
				nameFieldRegistrationForm,
				emailFieldRegistrationForm,
				limitTextLength,
				visitorsCanCloseChat,
			},
			departments = [],
		},
		token,
		agent,
		user,
		room,
		loading,
		dispatch,
		alerts,
		queueInfo,
	} = useStore();

	const { t } = useTranslation();

	const onRegisterUser = useCallback(() => {
		route('/register');
	}, []);

	const handleChangeDepartment = useCallback(() => {
		route('/switch-department');
	}, []);

	const connecting = !!(room && !agent && (showConnecting || queueInfo));

	const performSubmit = useStableCallback(async (msg: string) => {
		if (msg.trim() === '') {
			return;
		}

		const rid = await queryRoomId();

		try {
			stopTypingDebounced.stop();
			await Promise.all([stopTyping({ rid, username: user?.username ?? '' }), Livechat.sendMessage({ msg, token, rid })]);
		} catch (error: any) {
			const reason = error?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorActivity(rid, user?.username ?? '', []);
	});

	const handleFinishChat = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { _id: rid } = room || {};

		dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_closing_chat'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			dispatch({ loading: false });
		}
	});

	const handleRemoveUserData = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_removing_user_data'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await loadConfig();
			dispatch({ loading: false });
			route('/chat-finished');
		}
	});

	const canSwitchDepartment = useMemo(
		() => !!allowSwitchingDepartments && departments.filter((dept) => dept.showOnRegistration).length > 1,
		[allowSwitchingDepartments, departments],
	);

	const canFinishChat = !!visitorsCanCloseChat && (room?._id !== undefined || !!connecting);

	const canRemoveUserData = !!forceAcceptDataProcessingConsent;

	const registrationRequired = useMemo(() => {
		if (user?.token) {
			return false;
		}

		if (!registrationForm) {
			return false;
		}

		const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;
		return !!(nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment);
	}, [user?.token, registrationForm, departments, nameFieldRegistrationForm, emailFieldRegistrationForm]);

	const [msg, setMsg] = useState('');

	const handleSubmit = useStableCallback((text: string) => {
		setMsg('');
		onDismissEmojiPicker();
		void performSubmit(text);
	});

	const handleChangeText = useStableCallback((text: string) => {
		let value = text;
		if (limitTextLength && limitTextLength < text.length) {
			value = value.substring(0, limitTextLength);
		}
		setMsg(value);

		if (!(user?.username && room?._id)) return;
		startTyping({ rid: room._id, username: user.username });
	});

	const handleSendClick = useStableCallback((event?: Event) => {
		event?.preventDefault();
		handleSubmit(msg);
	});

	return (
		<ScreenFooter
			options={
				(canSwitchDepartment || canFinishChat || canRemoveUserData) && !registrationRequired ? (
					<FooterOptions>
						<MenuGroup>
							{canSwitchDepartment && (
								<MenuItem onClick={handleChangeDepartment} icon={ChangeIcon}>
									{t('change_department')}
								</MenuItem>
							)}
							{canRemoveUserData && (
								<MenuItem onClick={handleRemoveUserData} icon={RemoveIcon}>
									{t('forget_remove_my_data')}
								</MenuItem>
							)}
							{canFinishChat && (
								<MenuItem danger onClick={handleFinishChat} icon={FinishIcon}>
									{t('finish_this_chat')}
								</MenuItem>
							)}
						</MenuGroup>
					</FooterOptions>
				) : null
			}
			limit={limitTextLength ? <CharCounter limitTextLength={limitTextLength} textLength={msg.length} /> : null}
		>
			{registrationRequired ? (
				<Button loading={loading} disabled={loading} onClick={onRegisterUser} stack>
					{t('chat_now')}
				</Button>
			) : (
				<Composer
					onUpload={onUpload}
					onSubmit={handleSubmit}
					onChange={handleChangeText}
					placeholder={t('type_your_message_here')}
					value={msg}
					notifyEmojiSelect={(click: (native: string) => void) => {
						notifyEmojiSelectRef.current = click;
					}}
					handleEmojiClick={onDismissEmojiPicker}
					pre={
						<ComposerActions>
							<ComposerAction text='Add emoji' className={createClassName(styles, 'emoji-picker-icon')} onClick={onToggleEmojiPicker}>
								<EmojiIcon width={20} height={20} />
							</ComposerAction>
						</ComposerActions>
					}
					post={
						<ComposerActions>
							{msg.length === 0 && fileUpload && (
								<ComposerAction text='Add attachment' onClick={onAddAttachment}>
									<PlusIcon width={20} height={20} />
								</ComposerAction>
							)}
							{msg.length > 0 && (
								<ComposerAction text='Send' onClick={handleSendClick}>
									<SendIcon width={20} height={20} />
								</ComposerAction>
							)}
						</ComposerActions>
					}
					limitTextLength={limitTextLength}
				/>
			)}
		</ScreenFooter>
	);
};

export default ChatFooter;
