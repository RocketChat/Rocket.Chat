import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useCallback, useMemo, useSyncExternalStore } from 'react';

import ComposerSkeleton from './ComposerSkeleton';
import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { detectSensitiveContent } from '../../../lib/utils/detectSensitiveContent';
import { useChat } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	tmid?: IMessage['_id'];
	threadExists?: boolean;
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

const ComposerMessage = ({ tmid, onSend, ...props }: ComposerMessageProps) => {
	const chat = useChat();
	const room = useRoom();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const setModal = useSetModal();

	const warnSensitiveContent = useCallback(
		(text: string): Promise<boolean> =>
			new Promise((resolve) => {
				if (!detectSensitiveContent(text)) {
					resolve(true);
					return;
				}

				const close = () => setModal();

				const handleConfirm = () => {
					close();
					resolve(true);
				};

				const handleCancel = () => {
					close();
					resolve(false);
				};

				setModal(
					<GenericModal
						variant='warning'
						title={t('Sensitive_information_detected')}
						confirmText={t('Send_anyway')}
						cancelText={t('Edit_message')}
						onConfirm={handleConfirm}
						onCancel={handleCancel}
						onClose={handleCancel}
					>
						{t('Sensitive content warning')}
					</GenericModal>,
				);
			}),
		[setModal, t],
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
					await chat?.action.stop('typing');
					const shouldSend = await warnSensitiveContent(text);

					if (!shouldSend) {
						return;
					}
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
		[
			chat?.data,
			chat?.flows,
			chat?.action,
			chat?.composer?.text,
			chat?.messageEditing,
			dispatchToastMessage,
			tmid,
			onSend,
			warnSensitiveContent,
		],
	);

	const { subscribe, getSnapshotValue } = useMemo(() => {
		return LegacyRoomManager.listenRoomPropsByRid(room._id, 'streamActive');
	}, [room._id]);

	const publicationReady = useSyncExternalStore(subscribe, getSnapshotValue);

	if (!publicationReady) {
		return <ComposerSkeleton />;
	}

	return <MessageBox key={tmid ? `${room._id}-${tmid}` : room._id} tmid={tmid} {...composerProps} showFormattingTips={true} {...props} />;
};

export default memo(ComposerMessage);
