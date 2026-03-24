import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import { memo, useMemo, useSyncExternalStore, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ComposerSkeleton from './ComposerSkeleton';
import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { useChat } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	tmid?: IMessage['_id'];
	children?: ReactNode;
	subscription?: ISubscription;
	tshow?: boolean;
	previewUrls?: string[];
	onResize?: () => void;
	onEscape?: () => void;
	onSend?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onClickSelectAll?: () => void;
};

const ComposerMessage = ({ tmid, onSend, ...props }: ComposerMessageProps): ReactElement => {
	const { t } = useTranslation();
	const chat = useChat();
	const room = useRoom();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const requireConfirmation = useSetting('Message_RequireConfirmationToMentionAll');
	const minUsers = useSetting<number>('Message_MentionAll_Confirmation_MinUsers');
	const minTimezones = useSetting<number>('Message_MentionAll_Confirmation_MinTimezones');

	const checkAndShowMentionAllConfirmation = useCallback(
		async (text: string): Promise<boolean> => {
			if (!requireConfirmation || !text.includes('@all')) {
				return true; // Proceed with sending
			}

			const usersCount = room.usersCount || 0;
			const shouldShowConfirmation = (minUsers && usersCount >= minUsers) || (minTimezones && minTimezones > 0);

			if (!shouldShowConfirmation) {
				return true; // Proceed with sending
			}

			// Show confirmation modal and wait for user response
			return new Promise((resolve) => {
				const handleConfirm = () => {
					setModal(null);
					resolve(true);
				};

				const handleCancel = () => {
					setModal(null);
					resolve(false);
				};

				setModal(
					<GenericModal
						title={t('Message_MentionAll_Confirmation_Title')}
						confirmText={t('Send')}
						cancelText={t('Cancel')}
						onConfirm={handleConfirm}
						onCancel={handleCancel}
						variant='warning'
					>
						{t('Message_MentionAll_Confirmation_Description', {
							usersCount,
							timezonesCount: minTimezones || 1,
						})}
					</GenericModal>,
				);
			});
		},
		[requireConfirmation, minUsers, minTimezones, room.usersCount, t, setModal],
	);

	const composerProps = useMemo(
		() => ({
			onJoin: async (): Promise<void> => {
				try {
					await chat?.data?.joinRoom();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					throw error;
				}
			},

			onSend: async ({
				value: text,
				tshow,
				previewUrls,
				isSlashCommandAllowed,
			}: {
				value: string;
				tshow?: boolean;
				previewUrls?: string[];
				isSlashCommandAllowed?: boolean;
			}): Promise<void> => {
				try {
					// Check if we need to show @all confirmation
					const shouldProceed = await checkAndShowMentionAllConfirmation(text);
					if (!shouldProceed) {
						return;
					}

					await chat?.action.stop('typing');
					const newMessageSent = await chat?.flows.sendMessage({
						text,
						tshow,
						previewUrls,
						isSlashCommandAllowed,
						tmid,
					});
					if (newMessageSent) onSend?.();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
			onTyping: async (): Promise<void> => {
				if (chat?.composer?.text?.trim() === '') {
					await chat?.action.stop('typing');
					return;
				}
				await chat?.action.start('typing');
			},
			onNavigateToPreviousMessage: () => chat?.messageEditing.toPreviousMessage(),
			onNavigateToNextMessage: () => chat?.messageEditing.toNextMessage(),
		}),
		[chat?.data, chat?.flows, chat?.action, chat?.composer?.text, chat?.messageEditing, dispatchToastMessage, tmid, onSend, checkAndShowMentionAllConfirmation],
	);

	const { subscribe, getSnapshotValue } = useMemo(() => {
		return LegacyRoomManager.listenRoomPropsByRid(room._id, 'streamActive');
	}, [room._id]);

	const publicationReady = useSyncExternalStore(subscribe, getSnapshotValue);

	if (!publicationReady) {
		return <ComposerSkeleton />;
	}

	return <MessageBox key={room._id} tmid={tmid} {...composerProps} showFormattingTips={true} {...props} />;
};

export default memo(ComposerMessage);
